import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { PropertiesController } from './properties.controller';
import { PropertiesService } from './properties.service';
import { PricingService } from '../bookings/pricing.service';

describe('PropertiesController', () => {
  let controller: PropertiesController;
  let propertiesService: PropertiesService;

  const mockPaginatedResult = {
    data: [{ id: 'p1', title: 'Prop 1' }],
    pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
  };

  const mockProperty = {
    id: 'p1',
    hostId: 'host-1',
    title: 'Test Property',
    reviews: [],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PropertiesController],
      providers: [
        {
          provide: PropertiesService,
          useValue: {
            findAll: jest.fn().mockReturnValue(mockPaginatedResult),
            findById: jest.fn().mockReturnValue(mockProperty),
            create: jest.fn().mockReturnValue(mockProperty),
            update: jest.fn().mockReturnValue(mockProperty),
          },
        },
        {
          provide: PricingService,
          useValue: {
            calculateBookingPrice: jest.fn().mockReturnValue({
              nights: 3,
              subtotal: 600,
              cleaningFee: 50,
              serviceFee: 60,
              total: 710,
            }),
          },
        },
      ],
    }).compile();

    controller = module.get<PropertiesController>(PropertiesController);
    propertiesService = module.get<PropertiesService>(PropertiesService);
  });

  describe('findAll', () => {
    it('should call service with parsed filters', () => {
      controller.findAll(
        'Rio',
        undefined,
        'apartment',
        undefined,
        '100',
        '500',
        '2',
        undefined,
        'Wi-Fi,Pool',
        'price_asc',
        '1',
        '10',
      );

      expect(propertiesService.findAll).toHaveBeenCalledWith({
        city: 'Rio',
        state: undefined,
        propertyType: 'apartment',
        roomType: undefined,
        minPrice: 100,
        maxPrice: 500,
        guests: 2,
        bedrooms: undefined,
        amenities: ['Wi-Fi', 'Pool'],
        sortBy: 'price_asc',
        page: 1,
        limit: 10,
      });
    });

    it('should return paginated response', () => {
      const result = controller.findAll();
      expect(result).toEqual(mockPaginatedResult);
    });
  });

  describe('findOne', () => {
    it('should return property by id', () => {
      const result = controller.findOne('p1');
      expect(result).toEqual(mockProperty);
    });

    it('should throw NotFoundException for non-existent property', () => {
      (propertiesService.findById as jest.Mock).mockReturnValue(undefined);
      expect(() => controller.findOne('bad-id')).toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('should call service with hostId from request', () => {
      const user = { sub: 'host-1', email: 'h@test.com', role: 'host' };
      const body = { title: 'New Property' };
      controller.create(user, body as any);

      expect(propertiesService.create).toHaveBeenCalledWith('host-1', body);
    });
  });

  describe('update', () => {
    it('should call service with id, hostId from request, and body', () => {
      const user = { sub: 'host-1', email: 'h@test.com', role: 'host' };
      const body = { title: 'Updated' };
      controller.update('p1', user, body);

      expect(propertiesService.update).toHaveBeenCalledWith(
        'p1',
        'host-1',
        body,
      );
    });
  });
});
