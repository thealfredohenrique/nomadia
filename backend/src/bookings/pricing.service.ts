import { Injectable } from '@nestjs/common';
import { Property } from '../common/types';
import { SERVICE_FEE_RATE, MS_PER_DAY } from '../common/constants';

@Injectable()
export class PricingService {
  calculateBookingPrice(property: Property, checkIn: string, checkOut: string) {
    const nights = Math.ceil(
      (new Date(checkOut).getTime() - new Date(checkIn).getTime()) / MS_PER_DAY,
    );
    const subtotal = property.pricePerNight * nights;
    const serviceFee = Math.round(subtotal * SERVICE_FEE_RATE);
    const cleaningFee = property.cleaningFee;
    const total = subtotal + cleaningFee + serviceFee;
    return { nights, subtotal, cleaningFee, serviceFee, total };
  }
}
