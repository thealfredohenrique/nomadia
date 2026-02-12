import { User } from '../types';

export interface IUserRepository {
  findAll(): User[];
  findById(id: string): User | undefined;
  findByEmail(email: string): User | undefined;
  create(user: User): User;
  update(id: string, data: Partial<User>): User | undefined;
}

export const USER_REPOSITORY = 'USER_REPOSITORY';
