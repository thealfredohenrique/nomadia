import { Property } from '../../common/types';

export class PropertyFilterBuilder {
  private results: Property[];

  constructor(properties: Property[]) {
    this.results = properties.filter((p) => p.status === 'active');
  }

  byCity(city?: string): this {
    if (!city) return this;
    const search = city.toLowerCase();
    this.results = this.results.filter(
      (p) =>
        p.address.city.toLowerCase().includes(search) ||
        p.address.state.toLowerCase().includes(search) ||
        p.address.neighborhood.toLowerCase().includes(search),
    );
    return this;
  }

  byState(state?: string): this {
    if (!state) return this;
    this.results = this.results.filter(
      (p) => p.address.state.toLowerCase() === state.toLowerCase(),
    );
    return this;
  }

  byPropertyType(type?: string): this {
    if (!type) return this;
    this.results = this.results.filter((p) => p.propertyType === type);
    return this;
  }

  byRoomType(type?: string): this {
    if (!type) return this;
    this.results = this.results.filter((p) => p.roomType === type);
    return this;
  }

  byMinPrice(min?: number): this {
    if (min === undefined) return this;
    this.results = this.results.filter((p) => p.pricePerNight >= min);
    return this;
  }

  byMaxPrice(max?: number): this {
    if (max === undefined) return this;
    this.results = this.results.filter((p) => p.pricePerNight <= max);
    return this;
  }

  byGuests(guests?: number): this {
    if (!guests) return this;
    this.results = this.results.filter((p) => p.maxGuests >= guests);
    return this;
  }

  byBedrooms(bedrooms?: number): this {
    if (!bedrooms) return this;
    this.results = this.results.filter((p) => p.bedrooms >= bedrooms);
    return this;
  }

  byAmenities(amenities?: string[]): this {
    if (!amenities || amenities.length === 0) return this;
    this.results = this.results.filter((p) =>
      amenities.every((a) =>
        p.amenities.some((pa) => pa.toLowerCase().includes(a.toLowerCase())),
      ),
    );
    return this;
  }

  build(): Property[] {
    return this.results;
  }
}
