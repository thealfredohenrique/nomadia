import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

describe('UsersController', () => {
  let controller: UsersController;
  let usersService: UsersService;

  const mockUser = {
    id: 'user-1',
    email: 'test@example.com',
    passwordHash: 'secret-hash',
    firstName: 'Test',
    lastName: 'User',
    role: 'guest',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: {
            findById: jest.fn(),
            update: jest.fn(),
            getPublicProfile: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    usersService = module.get<UsersService>(UsersService);
  });

  describe('getMe', () => {
    it('should return user without passwordHash', () => {
      (usersService.findById as jest.Mock).mockReturnValue(mockUser);

      const req = { user: { sub: 'user-1' } };
      const result = controller.getMe(req);

      expect(result).not.toHaveProperty('passwordHash');
      expect(result).toHaveProperty('email', 'test@example.com');
    });

    it('should throw NotFoundException if user not found', () => {
      (usersService.findById as jest.Mock).mockReturnValue(undefined);

      const req = { user: { sub: 'non-existent' } };
      expect(() => controller.getMe(req)).toThrow(NotFoundException);
    });
  });

  describe('updateMe', () => {
    it('should update user and strip protected fields from body', () => {
      const updatedUser = { ...mockUser, firstName: 'Updated' };
      (usersService.update as jest.Mock).mockReturnValue(updatedUser);

      const req = { user: { sub: 'user-1' } };
      const body = {
        firstName: 'Updated',
        email: 'hack@evil.com',
        role: 'admin',
        id: 'hacked',
        passwordHash: 'hacked',
      };
      const result = controller.updateMe(req, body);

      expect(usersService.update).toHaveBeenCalledWith('user-1', {
        firstName: 'Updated',
      });
      expect(result).not.toHaveProperty('passwordHash');
    });

    it('should throw NotFoundException if user not found', () => {
      (usersService.update as jest.Mock).mockReturnValue(undefined);

      const req = { user: { sub: 'non-existent' } };
      expect(() => controller.updateMe(req, { firstName: 'Test' })).toThrow(
        NotFoundException,
      );
    });
  });

  describe('getPublicProfile', () => {
    it('should return public profile', () => {
      (usersService.findById as jest.Mock).mockReturnValue(mockUser);
      (usersService.getPublicProfile as jest.Mock).mockReturnValue({
        id: 'user-1',
        firstName: 'Test',
        role: 'guest',
      });

      const result = controller.getPublicProfile('user-1');
      expect(usersService.getPublicProfile).toHaveBeenCalledWith(mockUser);
      expect(result).toHaveProperty('id', 'user-1');
    });

    it('should throw NotFoundException for non-existent user', () => {
      (usersService.findById as jest.Mock).mockReturnValue(undefined);

      expect(() => controller.getPublicProfile('non-existent')).toThrow(
        NotFoundException,
      );
    });
  });
});
