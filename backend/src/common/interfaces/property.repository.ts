import { Property } from '../types';

export interface IPropertyRepository {
  findAll(): Property[];
  findById(id: string): Property | undefined;
  create(property: Property): Property;
  update(
    id: string,
    hostId: string,
    data: Partial<Property>,
  ): Property | undefined;
}

export const PROPERTY_REPOSITORY = 'PROPERTY_REPOSITORY';
