import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

describe('Properties (e2e)', () => {
  let app: INestApplication<App>;
  let hostToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // Login as host
    const loginRes = await request(app.getHttpServer())
      .post('/v1/auth/login')
      .send({ email: 'ana@example.com', password: 'mock.ana' });

    hostToken = loginRes.body.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /v1/properties', () => {
    it('should return paginated properties', () => {
      return request(app.getHttpServer())
        .get('/v1/properties')
        .expect(200)
        .expect((res) => {
          expect(res.body.data).toBeDefined();
          expect(Array.isArray(res.body.data)).toBe(true);
          expect(res.body.pagination).toBeDefined();
          expect(res.body.pagination.page).toBe(1);
        });
    });

    it('should filter by city', () => {
      return request(app.getHttpServer())
        .get('/v1/properties?city=Rio')
        .expect(200)
        .expect((res) => {
          res.body.data.forEach((p: any) => {
            const matches =
              p.address.city.toLowerCase().includes('rio') ||
              p.address.state.toLowerCase().includes('rio') ||
              p.address.neighborhood.toLowerCase().includes('rio');
            expect(matches).toBe(true);
          });
        });
    });

    it('should filter by property type', () => {
      return request(app.getHttpServer())
        .get('/v1/properties?propertyType=apartment')
        .expect(200)
        .expect((res) => {
          res.body.data.forEach((p: any) => {
            expect(p.propertyType).toBe('apartment');
          });
        });
    });

    it('should filter by price range', () => {
      return request(app.getHttpServer())
        .get('/v1/properties?minPrice=200&maxPrice=500')
        .expect(200)
        .expect((res) => {
          res.body.data.forEach((p: any) => {
            expect(p.pricePerNight).toBeGreaterThanOrEqual(200);
            expect(p.pricePerNight).toBeLessThanOrEqual(500);
          });
        });
    });

    it('should sort by price ascending', () => {
      return request(app.getHttpServer())
        .get('/v1/properties?sortBy=price_asc')
        .expect(200)
        .expect((res) => {
          for (let i = 1; i < res.body.data.length; i++) {
            expect(res.body.data[i].pricePerNight).toBeGreaterThanOrEqual(
              res.body.data[i - 1].pricePerNight,
            );
          }
        });
    });

    it('should paginate with limit', () => {
      return request(app.getHttpServer())
        .get('/v1/properties?page=1&limit=3')
        .expect(200)
        .expect((res) => {
          expect(res.body.data.length).toBeLessThanOrEqual(3);
          expect(res.body.pagination.limit).toBe(3);
        });
    });

    it('should not include reviews in list', () => {
      return request(app.getHttpServer())
        .get('/v1/properties')
        .expect(200)
        .expect((res) => {
          res.body.data.forEach((p: any) => {
            expect(p.reviews).toBeUndefined();
          });
        });
    });
  });

  describe('GET /v1/properties/:id', () => {
    it('should return property with reviews', async () => {
      const listRes = await request(app.getHttpServer())
        .get('/v1/properties?limit=1');

      const id = listRes.body.data[0].id;

      return request(app.getHttpServer())
        .get(`/v1/properties/${id}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.id).toBe(id);
          expect(res.body.reviews).toBeDefined();
        });
    });

    it('should return 404 for non-existent property', () => {
      return request(app.getHttpServer())
        .get('/v1/properties/non-existent')
        .expect(404);
    });
  });

  describe('POST /v1/properties', () => {
    it('should create a new property when authenticated as host', () => {
      return request(app.getHttpServer())
        .post('/v1/properties')
        .set('Authorization', `Bearer ${hostToken}`)
        .send({
          title: 'E2E Test Property',
          description: 'Created during e2e test',
          pricePerNight: 250,
          propertyType: 'apartment',
          maxGuests: 4,
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.title).toBe('E2E Test Property');
          expect(res.body.pricePerNight).toBe(250);
          expect(res.body.status).toBe('active');
          expect(res.body.hostId).toBeDefined();
        });
    });

    it('should return 401 without auth', () => {
      return request(app.getHttpServer())
        .post('/v1/properties')
        .send({ title: 'Unauthorized' })
        .expect(401);
    });
  });

  describe('PATCH /v1/properties/:id', () => {
    it('should update property when authenticated as owner', async () => {
      const createRes = await request(app.getHttpServer())
        .post('/v1/properties')
        .set('Authorization', `Bearer ${hostToken}`)
        .send({ title: 'To Update', pricePerNight: 100 });

      return request(app.getHttpServer())
        .patch(`/v1/properties/${createRes.body.id}`)
        .set('Authorization', `Bearer ${hostToken}`)
        .send({ title: 'Updated E2E', pricePerNight: 300 })
        .expect(200)
        .expect((res) => {
          expect(res.body.title).toBe('Updated E2E');
          expect(res.body.pricePerNight).toBe(300);
        });
    });

    it('should return 401 without auth', () => {
      return request(app.getHttpServer())
        .patch('/v1/properties/some-id')
        .send({ title: 'Hacked' })
        .expect(401);
    });
  });
});
