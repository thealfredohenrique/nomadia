import { Injectable } from '@nestjs/common';
import { User } from '../../common/types';
import { IUserRepository } from '../../common/interfaces/user.repository';
import { MOCK_USERS } from '../../common/mock-data';

@Injectable()
export class InMemoryUserRepository implements IUserRepository {
  private users: User[] = [...MOCK_USERS];

  findAll(): User[] {
    return this.users;
  }

  findById(id: string): User | undefined {
    return this.users.find((u) => u.id === id);
  }

  findByEmail(email: string): User | undefined {
    return this.users.find((u) => u.email === email);
  }

  create(user: User): User {
    this.users.push(user);
    return user;
  }

  update(id: string, data: Partial<User>): User | undefined {
    const index = this.users.findIndex((u) => u.id === id);
    if (index === -1) return undefined;
    this.users[index] = {
      ...this.users[index],
      ...data,
      updatedAt: new Date().toISOString(),
    };
    return this.users[index];
  }
}
