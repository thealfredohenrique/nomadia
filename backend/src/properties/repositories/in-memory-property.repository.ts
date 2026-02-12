import { Injectable, NotFoundException } from '@nestjs/common';
import { Property } from '../../common/types';
import { IPropertyRepository } from '../../common/interfaces/property.repository';
import { MOCK_PROPERTIES } from '../../common/mock-data';

@Injectable()
export class InMemoryPropertyRepository implements IPropertyRepository {
  private properties: Property[] = [...MOCK_PROPERTIES];

  findAll(): Property[] {
    return this.properties;
  }

  findById(id: string): Property | undefined {
    return this.properties.find((p) => p.id === id);
  }

  create(property: Property): Property {
    this.properties.push(property);
    return property;
  }

  update(
    id: string,
    hostId: string,
    data: Partial<Property>,
  ): Property | undefined {
    const index = this.properties.findIndex(
      (p) => p.id === id && p.hostId === hostId,
    );
    if (index === -1) return undefined;

    const { id: _, hostId: __, ...allowed } = data;
    this.properties[index] = {
      ...this.properties[index],
      ...allowed,
      updatedAt: new Date().toISOString(),
    };
    return this.properties[index];
  }
}
