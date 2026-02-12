import { Injectable, BadRequestException } from '@nestjs/common';
import { Property } from '../common/types';

@Injectable()
export class BookingValidator {
  validate(
    property: Property,
    dto: { guests: number; checkIn: string; checkOut: string },
    totalNights: number,
  ) {
    if (dto.guests > property.maxGuests) {
      throw new BadRequestException(
        `Número máximo de hóspedes: ${property.maxGuests}`,
      );
    }
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
  }
}
