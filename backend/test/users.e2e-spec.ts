import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

describe('Users (e2e)', () => {
  let app: INestApplication<App>;
  let accessToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // Login as mock user
    const loginRes = await request(app.getHttpServer())
      .post('/v1/auth/login')
      .send({ email: 'maria@example.com', password: 'mock.maria' });

    accessToken = loginRes.body.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /v1/users/me', () => {
    it('should return authenticated user profile', () => {
      return request(app.getHttpServer())
        .get('/v1/users/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.email).toBe('maria@example.com');
          expect(res.body.firstName).toBe('Maria');
          expect(res.body.passwordHash).toBeUndefined();
        });
    });

    it('should return 401 without auth', () => {
      return request(app.getHttpServer()).get('/v1/users/me').expect(401);
    });
  });

  describe('PATCH /v1/users/me', () => {
    it('should update user profile', () => {
      return request(app.getHttpServer())
        .patch('/v1/users/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ bio: 'Updated bio from e2e test' })
        .expect(200)
        .expect((res) => {
          expect(res.body.bio).toBe('Updated bio from e2e test');
          expect(res.body.passwordHash).toBeUndefined();
        });
    });

    it('should not allow changing email or role', () => {
      return request(app.getHttpServer())
        .patch('/v1/users/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ email: 'hacked@evil.com', role: 'admin' })
        .expect(200)
        .expect((res) => {
          expect(res.body.email).toBe('maria@example.com');
          expect(res.body.role).toBe('guest');
        });
    });

    it('should return 401 without auth', () => {
      return request(app.getHttpServer())
        .patch('/v1/users/me')
        .send({ bio: 'Hacked' })
        .expect(401);
    });
  });

  describe('GET /v1/users/:id', () => {
    it('should return public profile', () => {
      return request(app.getHttpServer())
        .get('/v1/users/u1-host-ana')
        .expect(200)
        .expect((res) => {
          expect(res.body.id).toBe('u1-host-ana');
          expect(res.body.firstName).toBe('Ana');
          expect(res.body.role).toBe('host');
          expect(res.body.email).toBeUndefined();
          expect(res.body.passwordHash).toBeUndefined();
          expect(res.body.phone).toBeUndefined();
        });
    });

    it('should return 404 for non-existent user', () => {
      return request(app.getHttpServer())
        .get('/v1/users/non-existent-id')
        .expect(404);
    });
  });
});
