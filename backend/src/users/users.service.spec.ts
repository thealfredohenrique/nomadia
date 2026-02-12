import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { User } from '../common/types';
import { USER_REPOSITORY } from '../common/interfaces/user.repository';
import { InMemoryUserRepository } from './repositories/in-memory-user.repository';

describe('UsersService', () => {
  let service: UsersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: USER_REPOSITORY, useClass: InMemoryUserRepository },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  describe('findAll', () => {
    it('should return all users including mock data', () => {
      const users = service.findAll();
      expect(users.length).toBeGreaterThanOrEqual(5);
    });
  });

  describe('findById', () => {
    it('should find a user by id', () => {
      const user = service.findById('u1-host-ana');
      expect(user).toBeDefined();
      expect(user!.firstName).toBe('Ana');
    });

    it('should return undefined for non-existent id', () => {
      const user = service.findById('non-existent');
      expect(user).toBeUndefined();
    });
  });

  describe('findByEmail', () => {
    it('should find a user by email', () => {
      const user = service.findByEmail('ana@example.com');
      expect(user).toBeDefined();
      expect(user!.id).toBe('u1-host-ana');
    });

    it('should return undefined for non-existent email', () => {
      const user = service.findByEmail('nobody@example.com');
      expect(user).toBeUndefined();
    });
  });

  describe('create', () => {
    it('should add a new user', () => {
      const newUser: User = {
        id: 'new-user',
        email: 'new@example.com',
        passwordHash: 'hash',
        firstName: 'New',
        lastName: 'User',
        language: 'pt-BR',
        currency: 'BRL',
        role: 'guest',
        isEmailVerified: false,
        isPhoneVerified: false,
        isIdentityVerified: false,
        isSuperhost: false,
        accountStatus: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const result = service.create(newUser);
      expect(result).toEqual(newUser);
      expect(service.findById('new-user')).toBeDefined();
    });
  });

  describe('update', () => {
    it('should update user fields', () => {
      const updated = service.update('u1-host-ana', { firstName: 'Ana Maria' });
      expect(updated).toBeDefined();
      expect(updated!.firstName).toBe('Ana Maria');
      expect(updated!.updatedAt).toBeDefined();
    });

    it('should return undefined for non-existent user', () => {
      const result = service.update('non-existent', { firstName: 'Test' });
      expect(result).toBeUndefined();
    });

    it('should update timestamp on modification', () => {
      const before = service.findById('u1-host-ana')!.updatedAt;
      const updated = service.update('u1-host-ana', { bio: 'Updated bio' });
      expect(updated!.updatedAt).not.toBe(before);
    });
  });

  describe('getPublicProfile', () => {
    it('should return only public fields', () => {
      const user = service.findById('u1-host-ana')!;
      const profile = service.getPublicProfile(user);

      expect(profile.id).toBe(user.id);
      expect(profile.firstName).toBe(user.firstName);
      expect(profile.role).toBe(user.role);
      expect(profile.isSuperhost).toBe(user.isSuperhost);
      expect(profile.memberSince).toBe(user.createdAt);
      expect((profile as any).email).toBeUndefined();
      expect((profile as any).passwordHash).toBeUndefined();
      expect((profile as any).phone).toBeUndefined();
      expect((profile as any).lastName).toBeUndefined();
    });
  });
});
