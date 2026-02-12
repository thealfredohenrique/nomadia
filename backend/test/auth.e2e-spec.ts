import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

describe('Auth (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /v1/auth/register', () => {
    it('should register a new user', () => {
      return request(app.getHttpServer())
        .post('/v1/auth/register')
        .send({
          email: 'e2e-register@example.com',
          password: 'Pass123!',
          firstName: 'E2E',
          lastName: 'User',
          role: 'guest',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.user).toBeDefined();
          expect(res.body.user.email).toBe('e2e-register@example.com');
          expect(res.body.user.passwordHash).toBeUndefined();
          expect(res.body.accessToken).toBeDefined();
          expect(res.body.refreshToken).toBeDefined();
          expect(res.body.expiresIn).toBe(900);
        });
    });

    it('should return 409 for duplicate email', async () => {
      await request(app.getHttpServer())
        .post('/v1/auth/register')
        .send({
          email: 'e2e-dup@example.com',
          password: 'Pass123!',
          firstName: 'Dup',
          lastName: 'User',
        })
        .expect(201);

      return request(app.getHttpServer())
        .post('/v1/auth/register')
        .send({
          email: 'e2e-dup@example.com',
          password: 'Pass123!',
          firstName: 'Dup2',
          lastName: 'User2',
        })
        .expect(409);
    });
  });

  describe('POST /v1/auth/login', () => {
    it('should login with valid credentials (mock user)', () => {
      return request(app.getHttpServer())
        .post('/v1/auth/login')
        .send({
          email: 'ana@example.com',
          password: 'mock.ana',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.user).toBeDefined();
          expect(res.body.user.email).toBe('ana@example.com');
          expect(res.body.accessToken).toBeDefined();
          expect(res.body.refreshToken).toBeDefined();
        });
    });

    it('should return 401 for wrong password', () => {
      return request(app.getHttpServer())
        .post('/v1/auth/login')
        .send({
          email: 'ana@example.com',
          password: 'wrong-password',
        })
        .expect(401);
    });

    it('should return 401 for non-existent email', () => {
      return request(app.getHttpServer())
        .post('/v1/auth/login')
        .send({
          email: 'no-one@example.com',
          password: 'pass',
        })
        .expect(401);
    });
  });

  describe('POST /v1/auth/refresh', () => {
    it('should refresh tokens with valid refresh token', async () => {
      const loginRes = await request(app.getHttpServer())
        .post('/v1/auth/login')
        .send({ email: 'ana@example.com', password: 'mock.ana' });

      return request(app.getHttpServer())
        .post('/v1/auth/refresh')
        .send({ refreshToken: loginRes.body.refreshToken })
        .expect(200)
        .expect((res) => {
          expect(res.body.accessToken).toBeDefined();
          expect(res.body.refreshToken).toBeDefined();
        });
    });

    it('should return 401 for invalid refresh token', () => {
      return request(app.getHttpServer())
        .post('/v1/auth/refresh')
        .send({ refreshToken: 'invalid-token' })
        .expect(401);
    });
  });

  describe('POST /v1/auth/logout', () => {
    it('should logout and invalidate refresh token', async () => {
      const loginRes = await request(app.getHttpServer())
        .post('/v1/auth/login')
        .send({ email: 'ana@example.com', password: 'mock.ana' });

      await request(app.getHttpServer())
        .post('/v1/auth/logout')
        .set('Authorization', `Bearer ${loginRes.body.accessToken}`)
        .send({ refreshToken: loginRes.body.refreshToken })
        .expect(204);

      // Refresh token should no longer work
      return request(app.getHttpServer())
        .post('/v1/auth/refresh')
        .send({ refreshToken: loginRes.body.refreshToken })
        .expect(401);
    });

    it('should return 401 without auth token', () => {
      return request(app.getHttpServer())
        .post('/v1/auth/logout')
        .send({ refreshToken: 'some-token' })
        .expect(401);
    });
  });

  describe('GET /v1/auth/me', () => {
    it('should return authenticated user profile', async () => {
      const loginRes = await request(app.getHttpServer())
        .post('/v1/auth/login')
        .send({ email: 'ana@example.com', password: 'mock.ana' });

      return request(app.getHttpServer())
        .get('/v1/auth/me')
        .set('Authorization', `Bearer ${loginRes.body.accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.email).toBe('ana@example.com');
          expect(res.body.passwordHash).toBeUndefined();
        });
    });

    it('should return 401 without auth', () => {
      return request(app.getHttpServer())
        .get('/v1/auth/me')
        .expect(401);
    });
  });
});
