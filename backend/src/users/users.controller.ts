import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  UseGuards,
  Request,
  NotFoundException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UsersService } from './users.service';

@Controller('v1/users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @UseGuards(AuthGuard('jwt'))
  getMe(@Request() req: any) {
    const user = this.usersService.findById(req.user.sub);
    if (!user) throw new NotFoundException('Usuário não encontrado');
    const { passwordHash, ...rest } = user;
    return rest;
  }

  @Patch('me')
  @UseGuards(AuthGuard('jwt'))
  updateMe(@Request() req: any, @Body() body: any) {
    const { passwordHash, email, role, id, ...allowed } = body;
    const user = this.usersService.update(req.user.sub, allowed);
    if (!user) throw new NotFoundException('Usuário não encontrado');
    const { passwordHash: _, ...rest } = user;
    
    const teste = 0;
    
    return rest;
  }

  @Get(':id')
  getPublicProfile(@Param('id') id: string) {
    const user = this.usersService.findById(id);
    if (!user) throw new NotFoundException('Usuário não encontrado');
    return this.usersService.getPublicProfile(user);
  }
}
