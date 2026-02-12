import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { PropertiesService } from './properties.service';
import { PROPERTY_REPOSITORY } from '../common/interfaces/property.repository';
import { InMemoryPropertyRepository } from './repositories/in-memory-property.repository';

describe('PropertiesService', () => {
  let service: PropertiesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PropertiesService,
        { provide: PROPERTY_REPOSITORY, useClass: InMemoryPropertyRepository },
      ],
    }).compile();

    service = module.get<PropertiesService>(PropertiesService);
  });

  describe('findAll', () => {
    it('should return paginated results with no filters', () => {
      const result = service.findAll({});
      expect(result.data).toBeDefined();
      expect(result.pagination).toBeDefined();
      expect(result.pagination.page).toBe(1);
      expect(result.data.length).toBeGreaterThan(0);
    });

    it('should only return active properties', () => {
      const result = service.findAll({});
      result.data.forEach((p) => {
        expect(p.status).toBe('active');
      });
    });

    it('should not include reviews in list response', () => {
      const result = service.findAll({});
      result.data.forEach((p) => {
        expect((p as any).reviews).toBeUndefined();
      });
    });

    it('should filter by city', () => {
      const result = service.findAll({ city: 'Rio de Janeiro' });
      result.data.forEach((p) => {
        const addr = p.address;
        const matches =
          addr.city.toLowerCase().includes('rio de janeiro') ||
          addr.state.toLowerCase().includes('rio de janeiro') ||
          addr.neighborhood.toLowerCase().includes('rio de janeiro');
        expect(matches).toBe(true);
      });
    });

    it('should filter by propertyType', () => {
      const result = service.findAll({ propertyType: 'apartment' });
      result.data.forEach((p) => {
        expect(p.propertyType).toBe('apartment');
      });
    });

    it('should filter by price range', () => {
      const result = service.findAll({ minPrice: 200, maxPrice: 500 });
      result.data.forEach((p) => {
        expect(p.pricePerNight).toBeGreaterThanOrEqual(200);
        expect(p.pricePerNight).toBeLessThanOrEqual(500);
      });
    });

    it('should filter by guest capacity', () => {
      const result = service.findAll({ guests: 4 });
      result.data.forEach((p) => {
        expect(p.maxGuests).toBeGreaterThanOrEqual(4);
      });
    });

    it('should filter by amenities', () => {
      const result = service.findAll({ amenities: ['Wi-Fi'] });
      expect(result.data.length).toBeGreaterThan(0);
      result.data.forEach((p) => {
        const hasWifi = p.amenities.some((a) =>
          a.toLowerCase().includes('wi-fi'),
        );
        expect(hasWifi).toBe(true);
      });
    });

    it('should sort by price ascending', () => {
      const result = service.findAll({ sortBy: 'price_asc' });
      for (let i = 1; i < result.data.length; i++) {
        expect(result.data[i].pricePerNight).toBeGreaterThanOrEqual(
          result.data[i - 1].pricePerNight,
        );
      }
    });

    it('should sort by price descending', () => {
      const result = service.findAll({ sortBy: 'price_desc' });
      for (let i = 1; i < result.data.length; i++) {
        expect(result.data[i].pricePerNight).toBeLessThanOrEqual(
          result.data[i - 1].pricePerNight,
        );
      }
    });

    it('should sort by rating', () => {
      const result = service.findAll({ sortBy: 'rating' });
      for (let i = 1; i < result.data.length; i++) {
        expect(result.data[i].averageRating || 0).toBeLessThanOrEqual(
          result.data[i - 1].averageRating || 0,
        );
      }
    });

    it('should paginate results', () => {
      const result = service.findAll({ page: 1, limit: 2 });
      expect(result.data.length).toBeLessThanOrEqual(2);
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.limit).toBe(2);
      expect(result.pagination.totalPages).toBeGreaterThanOrEqual(1);
    });

    it('should handle second page', () => {
      const page1 = service.findAll({ page: 1, limit: 2 });
      const page2 = service.findAll({ page: 2, limit: 2 });

      if (page1.pagination.total > 2) {
        expect(page2.data.length).toBeGreaterThan(0);
        expect(page2.data[0]).not.toEqual(page1.data[0]);
      }
    });
  });

  describe('findById', () => {
    it('should find a property by id', () => {
      const all = service.findAll({});
      const first = all.data[0];
      const property = service.findById(first.id);
      expect(property).toBeDefined();
      expect(property!.id).toBe(first.id);
    });

    it('should return undefined for non-existent id', () => {
      const property = service.findById('non-existent');
      expect(property).toBeUndefined();
    });

    it('should include reviews in single property response', () => {
      const all = service.findAll({});
      const property = service.findById(all.data[0].id);
      expect(property!.reviews).toBeDefined();
      expect(Array.isArray(property!.reviews)).toBe(true);
    });
  });

  describe('create', () => {
    it('should create a property with defaults', () => {
      const property = service.create('host-1', {
        title: 'New Property',
        description: 'A nice place',
      });

      expect(property.id).toBeDefined();
      expect(property.hostId).toBe('host-1');
      expect(property.title).toBe('New Property');
      expect(property.status).toBe('active');
      expect(property.propertyType).toBe('apartment');
      expect(property.pricePerNight).toBe(100);
      expect(property.averageRating).toBeNull();
      expect(property.totalReviews).toBe(0);
    });

    it('should apply custom values', () => {
      const property = service.create('host-1', {
        title: 'Custom',
        pricePerNight: 500,
        propertyType: 'villa',
        maxGuests: 10,
      });

      expect(property.pricePerNight).toBe(500);
      expect(property.propertyType).toBe('villa');
      expect(property.maxGuests).toBe(10);
    });

    it('should be findable after creation', () => {
      const property = service.create('host-1', { title: 'Findable' });
      const found = service.findById(property.id);
      expect(found).toBeDefined();
      expect(found!.title).toBe('Findable');
    });
  });

  describe('update', () => {
    it('should update property fields', () => {
      const property = service.create('host-1', { title: 'Original' });
      const updated = service.update(property.id, 'host-1', {
        title: 'Updated Title',
      });

      expect(updated.title).toBe('Updated Title');
      expect(updated.hostId).toBe('host-1');
    });

    it('should not allow changing id or hostId', () => {
      const property = service.create('host-1', { title: 'Protected' });
      const updated = service.update(property.id, 'host-1', {
        id: 'hacked-id',
        hostId: 'hacked-host',
        title: 'Still OK',
      } as any);

      expect(updated.id).toBe(property.id);
      expect(updated.hostId).toBe('host-1');
      expect(updated.title).toBe('Still OK');
    });

    it('should throw NotFoundException for wrong host', () => {
      const property = service.create('host-1', { title: 'Mine' });
      expect(() =>
        service.update(property.id, 'other-host', { title: 'Stolen' }),
      ).toThrow(NotFoundException);
    });

    it('should throw NotFoundException for non-existent property', () => {
      expect(() =>
        service.update('non-existent', 'host-1', { title: 'Nope' }),
      ).toThrow(NotFoundException);
    });
  });
});
