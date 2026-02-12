import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  UseGuards,
  NotFoundException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UsersService } from './users.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtPayload } from '../common/types';
import { UpdateUserDto } from './dto/update-user.dto';
import { toPublicUser } from '../common/sanitize';

@Controller('v1/users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @UseGuards(AuthGuard('jwt'))
  getMe(@CurrentUser() user: JwtPayload) {
    const found = this.usersService.findById(user.sub);
    if (!found) throw new NotFoundException('Usuário não encontrado');
    return toPublicUser(found);
  }

  @Patch('me')
  @UseGuards(AuthGuard('jwt'))
  updateMe(@CurrentUser() user: JwtPayload, @Body() body: UpdateUserDto) {
    const updated = this.usersService.update(user.sub, body);
    if (!updated) throw new NotFoundException('Usuário não encontrado');
    return toPublicUser(updated);
  }

  @Get(':id')
  getPublicProfile(@Param('id') id: string) {
    const user = this.usersService.findById(id);
    if (!user) throw new NotFoundException('Usuário não encontrado');
    return this.usersService.getPublicProfile(user);
  }
}
