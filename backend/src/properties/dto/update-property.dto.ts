import { IsString, IsOptional } from 'class-validator';
import { CreatePropertyDto } from './create-property.dto';

export class UpdatePropertyDto implements Partial<CreatePropertyDto> {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  propertyType?: 'apartment' | 'house' | 'villa' | 'room' | 'studio';

  @IsOptional()
  @IsString()
  roomType?: 'entire_place' | 'private_room' | 'shared_room';

  @IsOptional()
  maxGuests?: number;

  @IsOptional()
  bedrooms?: number;

  @IsOptional()
  beds?: number;

  @IsOptional()
  bathrooms?: number;

  @IsOptional()
  pricePerNight?: number;

  @IsOptional()
  cleaningFee?: number;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  minimumNights?: number;

  @IsOptional()
  maximumNights?: number;

  @IsOptional()
  @IsString()
  checkInTime?: string;

  @IsOptional()
  @IsString()
  checkOutTime?: string;

  @IsOptional()
  @IsString()
  cancellationPolicy?: 'flexible' | 'moderate' | 'strict';

  @IsOptional()
  instantBooking?: boolean;

  @IsOptional()
  address?: any;

  @IsOptional()
  photos?: any[];

  @IsOptional()
  amenities?: string[];
}
