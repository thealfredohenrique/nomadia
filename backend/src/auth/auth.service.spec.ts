import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';

describe('AuthService', () => {
  let service: AuthService;
  let usersService: UsersService;
  let jwtService: JwtService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: {
            findByEmail: jest.fn(),
            findById: jest.fn(),
            create: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn().mockReturnValue('mock-jwt-token'),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get<UsersService>(UsersService);
    jwtService = module.get<JwtService>(JwtService);
  });

  describe('register', () => {
    const dto = {
      email: 'new@example.com',
      password: 'Pass123!',
      firstName: 'Test',
      lastName: 'User',
      phone: '+5511999999999',
      role: 'guest' as const,
    };

    it('should register a new user and return tokens', async () => {
      (usersService.findByEmail as jest.Mock).mockReturnValue(undefined);
      (usersService.create as jest.Mock).mockImplementation((u) => u);

      const result = await service.register(dto);

      expect(result.user).toBeDefined();
      expect(result.user.email).toBe(dto.email);
      expect(result.user.firstName).toBe(dto.firstName);
      expect((result.user as any).passwordHash).toBeUndefined();
      expect(result.accessToken).toBe('mock-jwt-token');
      expect(result.refreshToken).toBeDefined();
      expect(result.expiresIn).toBe(900);
      expect(usersService.create).toHaveBeenCalled();
    });

    it('should throw ConflictException if email already exists', async () => {
      (usersService.findByEmail as jest.Mock).mockReturnValue({
        id: '1',
        email: dto.email,
      });

      await expect(service.register(dto)).rejects.toThrow(ConflictException);
    });

    it('should default role to guest when not provided', async () => {
      (usersService.findByEmail as jest.Mock).mockReturnValue(undefined);
      (usersService.create as jest.Mock).mockImplementation((u) => u);

      const { role, ...dtoWithoutRole } = dto;
      const result = await service.register(dtoWithoutRole);

      expect(result.user.role).toBe('guest');
    });
  });

  describe('login', () => {
    const mockUser = {
      id: 'user-1',
      email: 'test@example.com',
      passwordHash: '$2b$12$mock.correctpass',
      firstName: 'Test',
      lastName: 'User',
      role: 'guest',
      accountStatus: 'active',
    };

    it('should login with valid credentials', async () => {
      (usersService.findByEmail as jest.Mock).mockReturnValue(mockUser);

      const result = await service.login('test@example.com', 'correctpass');

      expect(result.user.email).toBe('test@example.com');
      expect((result.user as any).passwordHash).toBeUndefined();
      expect(result.accessToken).toBe('mock-jwt-token');
      expect(result.refreshToken).toBeDefined();
    });

    it('should throw UnauthorizedException for non-existent user', async () => {
      (usersService.findByEmail as jest.Mock).mockReturnValue(undefined);

      await expect(service.login('bad@example.com', 'pass')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException for wrong password', async () => {
      (usersService.findByEmail as jest.Mock).mockReturnValue(mockUser);

      await expect(
        service.login('test@example.com', 'wrongpass'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for suspended account', async () => {
      (usersService.findByEmail as jest.Mock).mockReturnValue({
        ...mockUser,
        passwordHash: '$2b$12$mock.correctpass',
        accountStatus: 'suspended',
      });

      await expect(
        service.login('test@example.com', 'correctpass'),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('refresh', () => {
    it('should refresh tokens with valid refresh token', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        role: 'guest',
      };
      (usersService.findByEmail as jest.Mock).mockReturnValue(undefined);
      (usersService.create as jest.Mock).mockImplementation((u) => u);

      // Register to get a refresh token
      const registerResult = await service.register({
        email: 'refresh@example.com',
        password: 'Pass123!',
        firstName: 'Test',
        lastName: 'User',
      });

      (usersService.findById as jest.Mock).mockReturnValue({
        id: 'some-id',
        email: 'refresh@example.com',
        role: 'guest',
      });

      const result = await service.refresh(registerResult.refreshToken);

      expect(result.accessToken).toBe('mock-jwt-token');
      expect(result.refreshToken).toBeDefined();
      expect(result.expiresIn).toBe(900);
    });

    it('should throw UnauthorizedException for invalid refresh token', async () => {
      await expect(service.refresh('invalid-token')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('logout', () => {
    it('should revoke refresh token', async () => {
      (usersService.findByEmail as jest.Mock).mockReturnValue(undefined);
      (usersService.create as jest.Mock).mockImplementation((u) => u);

      const registerResult = await service.register({
        email: 'logout@example.com',
        password: 'Pass123!',
        firstName: 'Test',
        lastName: 'User',
      });

      await service.logout(registerResult.refreshToken);

      // Trying to use the revoked refresh token should fail
      await expect(
        service.refresh(registerResult.refreshToken),
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});
