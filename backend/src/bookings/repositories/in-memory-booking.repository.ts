import { Injectable } from '@nestjs/common';
import { Booking } from '../../common/types';
import { IBookingRepository } from '../../common/interfaces/booking.repository';
import { MOCK_BOOKINGS } from '../../common/mock-data';

@Injectable()
export class InMemoryBookingRepository implements IBookingRepository {
  private bookings: Booking[] = [...MOCK_BOOKINGS];

  findAll(): Booking[] {
    return this.bookings;
  }

  findById(id: string): Booking | undefined {
    return this.bookings.find((b) => b.id === id);
  }

  findByUser(userId: string): Booking[] {
    return this.bookings.filter(
      (b) => b.guestId === userId || b.hostId === userId,
    );
  }

  create(booking: Booking): Booking {
    this.bookings.push(booking);
    return booking;
  }

  update(id: string, data: Partial<Booking>): Booking | undefined {
    const index = this.bookings.findIndex((b) => b.id === id);
    if (index === -1) return undefined;
    this.bookings[index] = {
      ...this.bookings[index],
      ...data,
    };
    return this.bookings[index];
  }
}
