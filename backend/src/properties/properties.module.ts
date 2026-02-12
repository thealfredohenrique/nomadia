import { Module } from '@nestjs/common';
import { PropertiesController } from './properties.controller';
import { PropertiesService } from './properties.service';
import { PROPERTY_REPOSITORY } from '../common/interfaces/property.repository';
import { InMemoryPropertyRepository } from './repositories/in-memory-property.repository';
import { PricingService } from '../bookings/pricing.service';

@Module({
  controllers: [PropertiesController],
  providers: [
    PropertiesService,
    PricingService,
    { provide: PROPERTY_REPOSITORY, useClass: InMemoryPropertyRepository },
  ],
  exports: [PropertiesService, PROPERTY_REPOSITORY],
})
export class PropertiesModule {}
