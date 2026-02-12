import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Query,
  Body,
  UseGuards,
  NotFoundException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PropertiesService } from './properties.service';
import { PricingService } from '../bookings/pricing.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtPayload } from '../common/types';
import { CreatePropertyDto } from './dto/create-property.dto';
import { UpdatePropertyDto } from './dto/update-property.dto';
import { DEFAULT_PAGE_LIMIT } from '../common/constants';

@Controller('v1/properties')
export class PropertiesController {
  constructor(
    private readonly propertiesService: PropertiesService,
    private readonly pricingService: PricingService,
  ) {}

  @Get()
  findAll(
    @Query('city') city?: string,
    @Query('state') state?: string,
    @Query('propertyType') propertyType?: string,
    @Query('roomType') roomType?: string,
    @Query('minPrice') minPrice?: string,
    @Query('maxPrice') maxPrice?: string,
    @Query('guests') guests?: string,
    @Query('bedrooms') bedrooms?: string,
    @Query('amenities') amenities?: string,
    @Query('sortBy') sortBy?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.propertiesService.findAll({
      city,
      state,
      propertyType,
      roomType,
      minPrice: minPrice ? Number(minPrice) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
      guests: guests ? Number(guests) : undefined,
      bedrooms: bedrooms ? Number(bedrooms) : undefined,
      amenities: amenities ? amenities.split(',') : undefined,
      sortBy,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : DEFAULT_PAGE_LIMIT,
    });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    const property = this.propertiesService.findById(id);
    if (!property) {
      throw new NotFoundException('Propriedade não encontrada');
    }
    return property;
  }

  @Get(':id/pricing')
  getPricing(
    @Param('id') id: string,
    @Query('checkIn') checkIn: string,
    @Query('checkOut') checkOut: string,
  ) {
    const property = this.propertiesService.findById(id);
    if (!property) {
      throw new NotFoundException('Propriedade não encontrada');
    }
    return this.pricingService.calculateBookingPrice(
      property,
      checkIn,
      checkOut,
    );
  }

  @Post()
  @UseGuards(AuthGuard('jwt'))
  create(@CurrentUser() user: JwtPayload, @Body() body: CreatePropertyDto) {
    return this.propertiesService.create(user.sub, body);
  }

  @Patch(':id')
  @UseGuards(AuthGuard('jwt'))
  update(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
    @Body() body: UpdatePropertyDto,
  ) {
    return this.propertiesService.update(id, user.sub, body);
  }
}
