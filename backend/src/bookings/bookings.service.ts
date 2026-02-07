import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Booking, PaginatedResponse } from '../common/types';
import { PropertiesService } from '../properties/properties.service';
import { MOCK_BOOKINGS } from '../common/mock-data';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class BookingsService {
  private bookings: Booking[] = [...MOCK_BOOKINGS];

  constructor(private readonly propertiesService: PropertiesService) {}

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

    if (dto.guests > property.maxGuests) {
      throw new BadRequestException(
        `Número máximo de hóspedes: ${property.maxGuests}`,
      );
    }

    const checkIn = new Date(dto.checkIn);
    const checkOut = new Date(dto.checkOut);
    const totalNights = Math.ceil(
      (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24),
    );

    if (totalNights < property.minimumNights) {
      throw new BadRequestException(
        `Estadia mínima: ${property.minimumNights} noites`,
      );
    }

    if (totalNights > property.maximumNights) {
      throw new BadRequestException(
        `Estadia máxima: ${property.maximumNights} noites`,
      );
    }

    const subtotal = property.pricePerNight * totalNights;
    const serviceFee = Math.round(subtotal * 0.1);
    const totalPrice = subtotal + property.cleaningFee + serviceFee;

    const booking: Booking = {
      id: uuidv4(),
      propertyId: dto.propertyId,
      guestId,
      hostId: property.hostId,
      checkIn: dto.checkIn,
      checkOut: dto.checkOut,
      guests: dto.guests,
      totalNights,
      pricePerNight: property.pricePerNight,
      cleaningFee: property.cleaningFee,
      serviceFee,
      totalPrice,
      currency: property.currency,
      status: property.instantBooking ? 'confirmed' : 'pending',
      propertyTitle: property.title,
      propertyPhoto: property.photos[0]?.url || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.bookings.push(booking);
    return booking;
  }

  findByUser(
    userId: string,
    filters: { status?: string; page?: number; limit?: number },
  ): PaginatedResponse<Booking> {
    let results = this.bookings.filter(
      (b) => b.guestId === userId || b.hostId === userId,
    );

    if (filters.status) {
      results = results.filter((b) => b.status === filters.status);
    }

    results.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const total = results.length;
    const totalPages = Math.ceil(total / limit);
    const start = (page - 1) * limit;
    const paged = results.slice(start, start + limit);

    return {
      data: paged,
      pagination: { page, limit, total, totalPages },
    };
  }

  findById(id: string): Booking | undefined {
    return this.bookings.find((b) => b.id === id);
  }

  cancel(id: string, userId: string): Booking {
    const booking = this.bookings.find(
      (b) => b.id === id && (b.guestId === userId || b.hostId === userId),
    );

    if (!booking) {
      throw new NotFoundException('Reserva não encontrada');
    }

    if (booking.status === 'cancelled') {
      throw new BadRequestException('Reserva já cancelada');
    }

    if (booking.status === 'completed') {
      throw new BadRequestException('Não é possível cancelar reserva concluída');
    }

    booking.status = 'cancelled';
    booking.updatedAt = new Date().toISOString();
    return booking;
  }
}
