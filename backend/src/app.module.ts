import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { PropertiesModule } from './properties/properties.module';
import { BookingsModule } from './bookings/bookings.module';

@Module({
  imports: [AuthModule, UsersModule, PropertiesModule, BookingsModule],
})
export class AppModule {}
