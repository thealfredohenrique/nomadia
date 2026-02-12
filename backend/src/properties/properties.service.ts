import { Injectable, Inject, Logger, NotFoundException } from '@nestjs/common';
import { Property, PaginatedResponse } from '../common/types';
import {
  IPropertyRepository,
  PROPERTY_REPOSITORY,
} from '../common/interfaces/property.repository';
import { PropertyFilterBuilder } from './filters/property-filter.builder';
import { sortProperties } from './filters/property-sort.strategy';
import { paginate } from '../common/paginate';
import { DEFAULT_PAGE_LIMIT } from '../common/constants';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class PropertiesService {
  private readonly logger = new Logger(PropertiesService.name);

  constructor(
    @Inject(PROPERTY_REPOSITORY)
    private readonly propertyRepo: IPropertyRepository,
  ) {}

  findAll(filters: {
    city?: string;
    state?: string;
    propertyType?: string;
    roomType?: string;
    minPrice?: number;
    maxPrice?: number;
    guests?: number;
    bedrooms?: number;
    amenities?: string[];
    sortBy?: string;
    page?: number;
    limit?: number;
  }): PaginatedResponse<Omit<Property, 'reviews'>> {
    const filtered = new PropertyFilterBuilder(this.propertyRepo.findAll())
      .byCity(filters.city)
      .byState(filters.state)
      .byPropertyType(filters.propertyType)
      .byRoomType(filters.roomType)
      .byMinPrice(filters.minPrice)
      .byMaxPrice(filters.maxPrice)
      .byGuests(filters.guests)
      .byBedrooms(filters.bedrooms)
      .byAmenities(filters.amenities)
      .build();

    const sorted = sortProperties(filtered, filters.sortBy);

    const page = filters.page || 1;
    const limit = filters.limit || DEFAULT_PAGE_LIMIT;
    const result = paginate(sorted, page, limit);

    const data = result.data.map(({ reviews, ...rest }) => rest);
    return { data, pagination: result.pagination };
  }

  findById(id: string): Property | undefined {
    return this.propertyRepo.findById(id);
  }

  create(hostId: string, dto: Partial<Property>): Property {
    const property: Property = {
      id: uuidv4(),
      hostId,
      title: dto.title || '',
      description: dto.description || '',
      propertyType: dto.propertyType || 'apartment',
      roomType: dto.roomType || 'entire_place',
      maxGuests: dto.maxGuests || 1,
      bedrooms: dto.bedrooms || 1,
      beds: dto.beds || 1,
      bathrooms: dto.bathrooms || 1,
      pricePerNight: dto.pricePerNight || 100,
      cleaningFee: dto.cleaningFee || 0,
      currency: dto.currency || 'BRL',
      minimumNights: dto.minimumNights || 1,
      maximumNights: dto.maximumNights || 365,
      checkInTime: dto.checkInTime || '14:00',
      checkOutTime: dto.checkOutTime || '11:00',
      cancellationPolicy: dto.cancellationPolicy || 'flexible',
      instantBooking: dto.instantBooking || false,
      status: 'active',
      averageRating: null,
      totalReviews: 0,
      viewsCount: 0,
      address: dto.address || {
        street: '',
        number: '',
        neighborhood: '',
        city: '',
        state: '',
        country: 'Brasil',
        zipCode: '',
        latitude: 0,
        longitude: 0,
      },
      photos: dto.photos || [],
      amenities: dto.amenities || [],
      reviews: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const created = this.propertyRepo.create(property);
    this.logger.log(`Property created: ${created.id} by host ${hostId}`);
    return created;
  }

  update(id: string, hostId: string, dto: Partial<Property>): Property {
    const updated = this.propertyRepo.update(id, hostId, dto);
    if (!updated) {
      throw new NotFoundException('Propriedade não encontrada');
    }
    this.logger.log(`Property updated: ${id}`);
    return updated;
  }
}
