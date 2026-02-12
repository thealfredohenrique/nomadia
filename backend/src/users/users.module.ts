import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { USER_REPOSITORY } from '../common/interfaces/user.repository';
import { InMemoryUserRepository } from './repositories/in-memory-user.repository';

@Module({
  controllers: [UsersController],
  providers: [
    UsersService,
    { provide: USER_REPOSITORY, useClass: InMemoryUserRepository },
  ],
  exports: [UsersService, USER_REPOSITORY],
})
export class UsersModule {}
