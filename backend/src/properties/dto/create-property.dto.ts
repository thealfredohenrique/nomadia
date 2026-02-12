import {
  IsString,
  IsNumber,
  IsBoolean,
  IsOptional,
  IsArray,
  IsInt,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class AddressDto {
  @IsOptional()
  @IsString()
  street?: string;

  @IsOptional()
  @IsString()
  number?: string;

  @IsOptional()
  @IsString()
  complement?: string;

  @IsOptional()
  @IsString()
  neighborhood?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  state?: string;

  @IsOptional()
  @IsString()
  country?: string;

  @IsOptional()
  @IsString()
  zipCode?: string;

  @IsOptional()
  @IsNumber()
  latitude?: number;

  @IsOptional()
  @IsNumber()
  longitude?: number;
}

export class CreatePropertyDto {
  @IsString()
  title: string;

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
  @IsInt()
  @Min(1)
  maxGuests?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  bedrooms?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  beds?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  bathrooms?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  pricePerNight?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  cleaningFee?: number;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  minimumNights?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
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
  @IsBoolean()
  instantBooking?: boolean;

  @IsOptional()
  @ValidateNested()
  @Type(() => AddressDto)
  address?: AddressDto;

  @IsOptional()
  @IsArray()
  photos?: any[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  amenities?: string[];
}
