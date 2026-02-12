import {
  Injectable,
  Inject,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Booking, PaginatedResponse } from '../common/types';
import { PropertiesService } from '../properties/properties.service';
import {
  IBookingRepository,
  BOOKING_REPOSITORY,
} from '../common/interfaces/booking.repository';
import { PricingService } from './pricing.service';
import { BookingValidator } from './booking.validator';
import { paginate } from '../common/paginate';
import { DEFAULT_PAGE_LIMIT } from '../common/constants';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class BookingsService {
  private readonly logger = new Logger(BookingsService.name);

  constructor(
    private readonly propertiesService: PropertiesService,
    @Inject(BOOKING_REPOSITORY)
    private readonly bookingRepo: IBookingRepository,
    private readonly pricingService: PricingService,
    private readonly bookingValidator: BookingValidator,
  ) {}

  create(
    guestId: string,
    dto: {
      propertyId: string;
      checkIn: string;
      checkOut: string;
      guests: number;
    },
  ): Booking {
    const property = this.propertiesService.findById(dto.propertyId);
    if (!property) {
      throw new NotFoundException('Propriedade não encontrada');
    }

    const pricing = this.pricingService.calculateBookingPrice(
      property,
      dto.checkIn,
      dto.checkOut,
    );

    this.bookingValidator.validate(property, dto, pricing.nights);

    const booking: Booking = {
      id: uuidv4(),
      propertyId: dto.propertyId,
      guestId,
      hostId: property.hostId,
      checkIn: dto.checkIn,
      checkOut: dto.checkOut,
      guests: dto.guests,
      totalNights: pricing.nights,
      pricePerNight: property.pricePerNight,
      cleaningFee: pricing.cleaningFee,
      serviceFee: pricing.serviceFee,
      totalPrice: pricing.total,
      currency: property.currency,
      status: property.instantBooking ? 'confirmed' : 'pending',
      propertyTitle: property.title,
      propertyPhoto: property.photos[0]?.url || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const created = this.bookingRepo.create(booking);
    this.logger.log(
      `Booking created: ${created.id} for property ${dto.propertyId}`,
    );
    return created;
  }

  findByUser(
    userId: string,
    filters: { status?: string; page?: number; limit?: number },
  ): PaginatedResponse<Booking> {
    let results = this.bookingRepo.findByUser(userId);

    if (filters.status) {
      results = results.filter((b) => b.status === filters.status);
    }

    results.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

    const page = filters.page || 1;
    const limit = filters.limit || DEFAULT_PAGE_LIMIT;
    return paginate(results, page, limit);
  }

  findById(id: string): Booking | undefined {
    return this.bookingRepo.findById(id);
  }

  cancel(id: string, userId: string): Booking {
    const booking = this.bookingRepo
      .findByUser(userId)
      .find((b) => b.id === id);

    if (!booking) {
      throw new NotFoundException('Reserva não encontrada');
    }

    if (booking.status === 'cancelled') {
      throw new BadRequestException('Reserva já cancelada');
    }

    if (booking.status === 'completed') {
      throw new BadRequestException(
        'Não é possível cancelar reserva concluída',
      );
    }

    const updated = this.bookingRepo.update(id, {
      status: 'cancelled',
      updatedAt: new Date().toISOString(),
    });

    this.logger.log(`Booking cancelled: ${id}`);
    return updated!;
  }
}
