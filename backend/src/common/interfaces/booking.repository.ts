import { Booking } from '../types';

export interface IBookingRepository {
  findAll(): Booking[];
  findById(id: string): Booking | undefined;
  findByUser(userId: string): Booking[];
  create(booking: Booking): Booking;
  update(id: string, data: Partial<Booking>): Booking | undefined;
}

export const BOOKING_REPOSITORY = 'BOOKING_REPOSITORY';
