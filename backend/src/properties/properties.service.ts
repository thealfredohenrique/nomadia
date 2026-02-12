import { Injectable, NotFoundException } from '@nestjs/common';
import { Property, PaginatedResponse } from '../common/types';
import { MOCK_PROPERTIES } from '../common/mock-data';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class PropertiesService {
  private properties: Property[] = [...MOCK_PROPERTIES];

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
    let results = this.properties.filter((p) => p.status === 'active');

    if (filters.city) {
      const search = filters.city.toLowerCase();
      results = results.filter(
        (p) =>
          p.address.city.toLowerCase().includes(search) ||
          p.address.state.toLowerCase().includes(search) ||
          p.address.neighborhood.toLowerCase().includes(search),
      );
    }

    if (filters.state) {
      results = results.filter(
        (p) => p.address.state.toLowerCase() === filters.state!.toLowerCase(),
      );
    }

    if (filters.propertyType) {
      results = results.filter((p) => p.propertyType === filters.propertyType);
    }

    if (filters.roomType) {
      results = results.filter((p) => p.roomType === filters.roomType);
    }

    if (filters.minPrice !== undefined) {
      results = results.filter((p) => p.pricePerNight >= filters.minPrice!);
    }

    if (filters.maxPrice !== undefined) {
      results = results.filter((p) => p.pricePerNight <= filters.maxPrice!);
    }

    if (filters.guests) {
      results = results.filter((p) => p.maxGuests >= filters.guests!);
    }

    if (filters.bedrooms) {
      results = results.filter((p) => p.bedrooms >= filters.bedrooms!);
    }

    if (filters.amenities && filters.amenities.length > 0) {
      results = results.filter((p) =>
        filters.amenities!.every((a) =>
          p.amenities.some((pa) => pa.toLowerCase().includes(a.toLowerCase())),
        ),
      );
    }

    // Sort
    switch (filters.sortBy) {
      case 'price_asc':
        results.sort((a, b) => a.pricePerNight - b.pricePerNight);
        break;
      case 'price_desc':
        results.sort((a, b) => b.pricePerNight - a.pricePerNight);
        break;
      case 'rating':
        results.sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0));
        break;
      case 'reviews':
        results.sort((a, b) => b.totalReviews - a.totalReviews);
        break;
      default:
        results.sort((a, b) => b.viewsCount - a.viewsCount);
    }

    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const total = results.length;
    const totalPages = Math.ceil(total / limit);
    const start = (page - 1) * limit;
    const paged = results.slice(start, start + limit);

    // Remove reviews from list response for performance
    const data = paged.map(({ reviews, ...rest }) => rest);

    return {
      data,
      pagination: { page, limit, total, totalPages },
    };
  }

  findById(id: string): Property | undefined {
    return this.properties.find((p) => p.id === id);
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

    this.properties.push(property);
    return property;
  }

  update(id: string, hostId: string, dto: Partial<Property>): Property {
    const index = this.properties.findIndex(
      (p) => p.id === id && p.hostId === hostId,
    );
    if (index === -1) {
      throw new NotFoundException('Propriedade não encontrada');
    }

    const { id: _, hostId: __, ...allowed } = dto;
    this.properties[index] = {
      ...this.properties[index],
      ...allowed,
      updatedAt: new Date().toISOString(),
    };
    return this.properties[index];
  }
}
