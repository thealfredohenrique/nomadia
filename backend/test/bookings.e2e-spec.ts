import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

describe('Bookings (e2e)', () => {
  let app: INestApplication<App>;
  let guestToken: string;
  let propertyId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // Login as guest
    const loginRes = await request(app.getHttpServer())
      .post('/v1/auth/login')
      .send({ email: 'maria@example.com', password: 'mock.maria' });

    guestToken = loginRes.body.accessToken;

    // Get a property ID for booking
    const propsRes = await request(app.getHttpServer()).get(
      '/v1/properties?limit=1',
    );

    propertyId = propsRes.body.data[0].id;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /v1/bookings', () => {
    it('should create a booking', () => {
      return request(app.getHttpServer())
        .post('/v1/bookings')
        .set('Authorization', `Bearer ${guestToken}`)
        .send({
          propertyId,
          checkIn: '2026-06-01',
          checkOut: '2026-06-05',
          guests: 2,
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.id).toBeDefined();
          expect(res.body.propertyId).toBe(propertyId);
          expect(res.body.totalNights).toBe(4);
          expect(res.body.totalPrice).toBeGreaterThan(0);
          expect(res.body.serviceFee).toBeGreaterThan(0);
          expect(['confirmed', 'pending']).toContain(res.body.status);
        });
    });

    it('should return 404 for non-existent property', () => {
      return request(app.getHttpServer())
        .post('/v1/bookings')
        .set('Authorization', `Bearer ${guestToken}`)
        .send({
          propertyId: 'non-existent',
          checkIn: '2026-06-01',
          checkOut: '2026-06-05',
          guests: 2,
        })
        .expect(404);
    });

    it('should return 400 when guests exceed max', () => {
      return request(app.getHttpServer())
        .post('/v1/bookings')
        .set('Authorization', `Bearer ${guestToken}`)
        .send({
          propertyId,
          checkIn: '2026-07-01',
          checkOut: '2026-07-05',
          guests: 100,
        })
        .expect(400);
    });

    it('should return 401 without auth', () => {
      return request(app.getHttpServer())
        .post('/v1/bookings')
        .send({
          propertyId,
          checkIn: '2026-06-01',
          checkOut: '2026-06-05',
          guests: 2,
        })
        .expect(401);
    });
  });

  describe('GET /v1/bookings', () => {
    it('should return user bookings', () => {
      return request(app.getHttpServer())
        .get('/v1/bookings')
        .set('Authorization', `Bearer ${guestToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.data).toBeDefined();
          expect(Array.isArray(res.body.data)).toBe(true);
          expect(res.body.pagination).toBeDefined();
        });
    });

    it('should filter by status', () => {
      return request(app.getHttpServer())
        .get('/v1/bookings?status=confirmed')
        .set('Authorization', `Bearer ${guestToken}`)
        .expect(200)
        .expect((res) => {
          res.body.data.forEach((b: any) => {
            expect(b.status).toBe('confirmed');
          });
        });
    });

    it('should return 401 without auth', () => {
      return request(app.getHttpServer()).get('/v1/bookings').expect(401);
    });
  });

  describe('GET /v1/bookings/:id', () => {
    it('should return booking details', async () => {
      const createRes = await request(app.getHttpServer())
        .post('/v1/bookings')
        .set('Authorization', `Bearer ${guestToken}`)
        .send({
          propertyId,
          checkIn: '2026-08-01',
          checkOut: '2026-08-05',
          guests: 2,
        });

      return request(app.getHttpServer())
        .get(`/v1/bookings/${createRes.body.id}`)
        .set('Authorization', `Bearer ${guestToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.id).toBe(createRes.body.id);
          expect(res.body.totalPrice).toBeDefined();
        });
    });

    it('should return 404 for non-existent booking', () => {
      return request(app.getHttpServer())
        .get('/v1/bookings/non-existent')
        .set('Authorization', `Bearer ${guestToken}`)
        .expect(404);
    });

    it('should return 401 without auth', () => {
      return request(app.getHttpServer())
        .get('/v1/bookings/some-id')
        .expect(401);
    });
  });

  describe('PATCH /v1/bookings/:id/cancel', () => {
    it('should cancel a booking', async () => {
      const createRes = await request(app.getHttpServer())
        .post('/v1/bookings')
        .set('Authorization', `Bearer ${guestToken}`)
        .send({
          propertyId,
          checkIn: '2026-09-01',
          checkOut: '2026-09-05',
          guests: 2,
        });

      return request(app.getHttpServer())
        .patch(`/v1/bookings/${createRes.body.id}/cancel`)
        .set('Authorization', `Bearer ${guestToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.status).toBe('cancelled');
        });
    });

    it('should return 400 when cancelling already cancelled booking', async () => {
      const createRes = await request(app.getHttpServer())
        .post('/v1/bookings')
        .set('Authorization', `Bearer ${guestToken}`)
        .send({
          propertyId,
          checkIn: '2026-10-01',
          checkOut: '2026-10-05',
          guests: 2,
        });

      await request(app.getHttpServer())
        .patch(`/v1/bookings/${createRes.body.id}/cancel`)
        .set('Authorization', `Bearer ${guestToken}`)
        .expect(200);

      return request(app.getHttpServer())
        .patch(`/v1/bookings/${createRes.body.id}/cancel`)
        .set('Authorization', `Bearer ${guestToken}`)
        .expect(400);
    });

    it('should return 401 without auth', () => {
      return request(app.getHttpServer())
        .patch('/v1/bookings/some-id/cancel')
        .expect(401);
    });
  });
});
