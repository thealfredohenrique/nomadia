import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { PropertiesService } from '../properties/properties.service';
import { PricingService } from './pricing.service';
import { BookingValidator } from './booking.validator';
import { BOOKING_REPOSITORY } from '../common/interfaces/booking.repository';
import { InMemoryBookingRepository } from './repositories/in-memory-booking.repository';

describe('BookingsService', () => {
  let service: BookingsService;
  let propertiesService: PropertiesService;

  const mockProperty = {
    id: 'prop-1',
    hostId: 'host-1',
    title: 'Test Property',
    pricePerNight: 200,
    cleaningFee: 50,
    currency: 'BRL',
    maxGuests: 4,
    minimumNights: 2,
    maximumNights: 30,
    instantBooking: true,
    photos: [{ id: '1', url: 'http://photo.jpg', order: 0 }],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BookingsService,
        PricingService,
        BookingValidator,
        { provide: BOOKING_REPOSITORY, useClass: InMemoryBookingRepository },
        {
          provide: PropertiesService,
          useValue: {
            findById: jest.fn().mockReturnValue(mockProperty),
          },
        },
      ],
    }).compile();

    service = module.get<BookingsService>(BookingsService);
    propertiesService = module.get<PropertiesService>(PropertiesService);
  });

  describe('create', () => {
    const dto = {
      propertyId: 'prop-1',
      checkIn: '2026-03-01',
      checkOut: '2026-03-05',
      guests: 2,
    };

    it('should create a booking with correct calculations', () => {
      const booking = service.create('guest-1', dto);

      expect(booking.id).toBeDefined();
      expect(booking.propertyId).toBe('prop-1');
      expect(booking.guestId).toBe('guest-1');
      expect(booking.hostId).toBe('host-1');
      expect(booking.totalNights).toBe(4);
      expect(booking.pricePerNight).toBe(200);
      expect(booking.cleaningFee).toBe(50);
      // serviceFee = Math.round(200 * 4 * 0.1) = 80
      expect(booking.serviceFee).toBe(80);
      // totalPrice = 800 + 50 + 80 = 930
      expect(booking.totalPrice).toBe(930);
      expect(booking.currency).toBe('BRL');
    });

    it('should set status to confirmed for instant booking', () => {
      const booking = service.create('guest-1', dto);
      expect(booking.status).toBe('confirmed');
    });

    it('should set status to pending for non-instant booking', () => {
      (propertiesService.findById as jest.Mock).mockReturnValue({
        ...mockProperty,
        instantBooking: false,
      });

      const booking = service.create('guest-1', dto);
      expect(booking.status).toBe('pending');
    });

    it('should throw NotFoundException for non-existent property', () => {
      (propertiesService.findById as jest.Mock).mockReturnValue(undefined);

      expect(() => service.create('guest-1', dto)).toThrow(NotFoundException);
    });

    it('should throw BadRequestException when guests exceed max', () => {
      expect(() => service.create('guest-1', { ...dto, guests: 10 })).toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException when stay is below minimum nights', () => {
      expect(() =>
        service.create('guest-1', {
          ...dto,
          checkIn: '2026-03-01',
          checkOut: '2026-03-02', // 1 night, minimum is 2
        }),
      ).toThrow(BadRequestException);
    });

    it('should throw BadRequestException when stay exceeds maximum nights', () => {
      (propertiesService.findById as jest.Mock).mockReturnValue({
        ...mockProperty,
        maximumNights: 3,
      });

      expect(
        () => service.create('guest-1', dto), // 4 nights > max 3
      ).toThrow(BadRequestException);
    });

    it('should use first photo URL for propertyPhoto', () => {
      const booking = service.create('guest-1', dto);
      expect(booking.propertyPhoto).toBe('http://photo.jpg');
    });

    it('should handle property with no photos', () => {
      (propertiesService.findById as jest.Mock).mockReturnValue({
        ...mockProperty,
        photos: [],
      });

      const booking = service.create('guest-1', dto);
      expect(booking.propertyPhoto).toBe('');
    });
  });

  describe('findByUser', () => {
    beforeEach(() => {
      // Create some bookings for testing
      service.create('guest-1', {
        propertyId: 'prop-1',
        checkIn: '2026-04-01',
        checkOut: '2026-04-05',
        guests: 2,
      });
      service.create('guest-1', {
        propertyId: 'prop-1',
        checkIn: '2026-05-01',
        checkOut: '2026-05-05',
        guests: 2,
      });
      service.create('guest-2', {
        propertyId: 'prop-1',
        checkIn: '2026-06-01',
        checkOut: '2026-06-05',
        guests: 2,
      });
    });

    it('should return bookings for guest', () => {
      const result = service.findByUser('guest-1', {});
      expect(result.data.length).toBeGreaterThanOrEqual(2);
      result.data.forEach((b) => {
        expect(b.guestId === 'guest-1' || b.hostId === 'guest-1').toBe(true);
      });
    });

    it('should return bookings for host', () => {
      const result = service.findByUser('host-1', {});
      expect(result.data.length).toBeGreaterThan(0);
    });

    it('should filter by status', () => {
      const result = service.findByUser('guest-1', { status: 'confirmed' });
      result.data.forEach((b) => {
        expect(b.status).toBe('confirmed');
      });
    });

    it('should paginate results', () => {
      const result = service.findByUser('guest-1', { page: 1, limit: 1 });
      expect(result.data.length).toBeLessThanOrEqual(1);
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.limit).toBe(1);
    });

    it('should sort by createdAt descending', () => {
      const result = service.findByUser('guest-1', {});
      for (let i = 1; i < result.data.length; i++) {
        expect(
          new Date(result.data[i].createdAt).getTime(),
        ).toBeLessThanOrEqual(new Date(result.data[i - 1].createdAt).getTime());
      }
    });
  });

  describe('findById', () => {
    it('should find a booking by id', () => {
      const created = service.create('guest-1', {
        propertyId: 'prop-1',
        checkIn: '2026-07-01',
        checkOut: '2026-07-05',
        guests: 2,
      });

      const found = service.findById(created.id);
      expect(found).toBeDefined();
      expect(found!.id).toBe(created.id);
    });

    it('should return undefined for non-existent booking', () => {
      const found = service.findById('non-existent');
      expect(found).toBeUndefined();
    });
  });

  describe('cancel', () => {
    it('should cancel a confirmed booking', () => {
      const booking = service.create('guest-1', {
        propertyId: 'prop-1',
        checkIn: '2026-08-01',
        checkOut: '2026-08-05',
        guests: 2,
      });

      const cancelled = service.cancel(booking.id, 'guest-1');
      expect(cancelled.status).toBe('cancelled');
    });

    it('should throw NotFoundException for non-existent booking', () => {
      expect(() => service.cancel('non-existent', 'guest-1')).toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException when user is not guest or host', () => {
      const booking = service.create('guest-1', {
        propertyId: 'prop-1',
        checkIn: '2026-09-01',
        checkOut: '2026-09-05',
        guests: 2,
      });

      expect(() => service.cancel(booking.id, 'other-user')).toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException for already cancelled booking', () => {
      const booking = service.create('guest-1', {
        propertyId: 'prop-1',
        checkIn: '2026-10-01',
        checkOut: '2026-10-05',
        guests: 2,
      });

      service.cancel(booking.id, 'guest-1');
      expect(() => service.cancel(booking.id, 'guest-1')).toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException for completed booking', () => {
      const booking = service.create('guest-1', {
        propertyId: 'prop-1',
        checkIn: '2026-11-01',
        checkOut: '2026-11-05',
        guests: 2,
      });

      // Manually set status to completed
      const found = service.findById(booking.id)!;
      (found as any).status = 'completed';

      expect(() => service.cancel(booking.id, 'guest-1')).toThrow(
        BadRequestException,
      );
    });

    it('should allow host to cancel booking', () => {
      const booking = service.create('guest-1', {
        propertyId: 'prop-1',
        checkIn: '2026-12-01',
        checkOut: '2026-12-05',
        guests: 2,
      });

      const cancelled = service.cancel(booking.id, 'host-1');
      expect(cancelled.status).toBe('cancelled');
    });
  });
});
