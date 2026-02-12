import { Module } from '@nestjs/common';
import { BookingsController } from './bookings.controller';
import { BookingsService } from './bookings.service';
import { PricingService } from './pricing.service';
import { BookingValidator } from './booking.validator';
import { PropertiesModule } from '../properties/properties.module';
import { BOOKING_REPOSITORY } from '../common/interfaces/booking.repository';
import { InMemoryBookingRepository } from './repositories/in-memory-booking.repository';

@Module({
  imports: [PropertiesModule],
  controllers: [BookingsController],
  providers: [
    BookingsService,
    PricingService,
    BookingValidator,
    { provide: BOOKING_REPOSITORY, useClass: InMemoryBookingRepository },
  ],
  exports: [BookingsService],
})
export class BookingsModule {}
