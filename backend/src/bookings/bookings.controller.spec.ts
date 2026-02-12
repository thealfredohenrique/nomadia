import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { BookingsController } from './bookings.controller';
import { BookingsService } from './bookings.service';

describe('BookingsController', () => {
  let controller: BookingsController;
  let bookingsService: BookingsService;

  const mockBooking = {
    id: 'b1',
    propertyId: 'p1',
    guestId: 'guest-1',
    hostId: 'host-1',
    status: 'confirmed',
  };

  const mockPaginatedResult = {
    data: [mockBooking],
    pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BookingsController],
      providers: [
        {
          provide: BookingsService,
          useValue: {
            create: jest.fn().mockReturnValue(mockBooking),
            findByUser: jest.fn().mockReturnValue(mockPaginatedResult),
            findById: jest.fn().mockReturnValue(mockBooking),
            cancel: jest.fn().mockReturnValue({ ...mockBooking, status: 'cancelled' }),
          },
        },
      ],
    }).compile();

    controller = module.get<BookingsController>(BookingsController);
    bookingsService = module.get<BookingsService>(BookingsService);
  });

  describe('create', () => {
    it('should call service with guestId from request', () => {
      const req = { user: { sub: 'guest-1' } };
      const body = {
        propertyId: 'p1',
        checkIn: '2026-03-01',
        checkOut: '2026-03-05',
        guests: 2,
      };

      controller.create(req, body);
      expect(bookingsService.create).toHaveBeenCalledWith('guest-1', body);
    });
  });

  describe('findAll', () => {
    it('should call service with userId and parsed filters', () => {
      const req = { user: { sub: 'guest-1' } };
      controller.findAll(req, 'confirmed', '2', '5');

      expect(bookingsService.findByUser).toHaveBeenCalledWith('guest-1', {
        status: 'confirmed',
        page: 2,
        limit: 5,
      });
    });

    it('should use default pagination when not provided', () => {
      const req = { user: { sub: 'guest-1' } };
      controller.findAll(req);

      expect(bookingsService.findByUser).toHaveBeenCalledWith('guest-1', {
        status: undefined,
        page: 1,
        limit: 20,
      });
    });
  });

  describe('findOne', () => {
    it('should return booking by id', () => {
      const req = { user: { sub: 'guest-1' } };
      const result = controller.findOne('b1', req);
      expect(result).toEqual(mockBooking);
    });

    it('should throw NotFoundException for non-existent booking', () => {
      (bookingsService.findById as jest.Mock).mockReturnValue(undefined);

      const req = { user: { sub: 'guest-1' } };
      expect(() => controller.findOne('bad-id', req)).toThrow(
        NotFoundException,
      );
    });
  });

  describe('cancel', () => {
    it('should call service.cancel with booking id and userId', () => {
      const req = { user: { sub: 'guest-1' } };
      const result = controller.cancel('b1', req);

      expect(bookingsService.cancel).toHaveBeenCalledWith('b1', 'guest-1');
      expect(result).toHaveProperty('status', 'cancelled');
    });
  });
});
