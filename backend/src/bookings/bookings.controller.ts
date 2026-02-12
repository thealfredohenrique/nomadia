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
  ForbiddenException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { BookingsService } from './bookings.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtPayload } from '../common/types';
import { CreateBookingDto } from './dto/create-booking.dto';
import { DEFAULT_PAGE_LIMIT } from '../common/constants';

@Controller('v1/bookings')
@UseGuards(AuthGuard('jwt'))
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Post()
  create(@CurrentUser() user: JwtPayload, @Body() body: CreateBookingDto) {
    return this.bookingsService.create(user.sub, body);
  }

  @Get()
  findAll(
    @CurrentUser() user: JwtPayload,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.bookingsService.findByUser(user.sub, {
      status,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : DEFAULT_PAGE_LIMIT,
    });
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    const booking = this.bookingsService.findById(id);
    if (!booking) {
      throw new NotFoundException('Reserva não encontrada');
    }
    if (booking.guestId !== user.sub && booking.hostId !== user.sub) {
      throw new ForbiddenException(
        'Você não tem permissão para acessar esta reserva',
      );
    }
    return booking;
  }

  @Patch(':id/cancel')
  cancel(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.bookingsService.cancel(id, user.sub);
  }
}
