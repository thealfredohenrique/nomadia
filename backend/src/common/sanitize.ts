import { User } from './types';

export type UserPublic = Omit<User, 'passwordHash'>;

export function toPublicUser(user: User): UserPublic {
  const { passwordHash, ...rest } = user;
  return rest;
}
