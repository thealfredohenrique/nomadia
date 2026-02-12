import { Injectable, Inject } from '@nestjs/common';
import { User } from '../common/types';
import {
  IUserRepository,
  USER_REPOSITORY,
} from '../common/interfaces/user.repository';

@Injectable()
export class UsersService {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepo: IUserRepository,
  ) {}

  findAll(): User[] {
    return this.userRepo.findAll();
  }

  findById(id: string): User | undefined {
    return this.userRepo.findById(id);
  }

  findByEmail(email: string): User | undefined {
    return this.userRepo.findByEmail(email);
  }

  create(user: User): User {
    return this.userRepo.create(user);
  }

  update(id: string, data: Partial<User>): User | undefined {
    return this.userRepo.update(id, data);
  }

  getPublicProfile(user: User) {
    return {
      id: user.id,
      firstName: user.firstName,
      profilePhotoUrl: user.profilePhotoUrl,
      bio: user.bio,
      isSuperhost: user.isSuperhost,
      isIdentityVerified: user.isIdentityVerified,
      memberSince: user.createdAt,
      role: user.role,
    };
  }
}
