import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            register: jest.fn(),
            login: jest.fn(),
            refresh: jest.fn(),
            logout: jest.fn(),
            getCurrentUser: jest.fn(),
          },
        },
      ],
    })
      .overrideGuard(ThrottlerGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
  });

  describe('register', () => {
    it('should call authService.register with body', async () => {
      const body = {
        email: 'test@example.com',
        password: 'Pass123!',
        firstName: 'Test',
        lastName: 'User',
      };
      const expected = {
        user: { id: '1', email: body.email },
        accessToken: 'jwt',
        refreshToken: 'rt',
        expiresIn: 900,
      };
      (authService.register as jest.Mock).mockResolvedValue(expected);

      const result = await controller.register(body);
      expect(authService.register).toHaveBeenCalledWith(body);
      expect(result).toEqual(expected);
    });
  });

  describe('login', () => {
    it('should call authService.login with email and password', async () => {
      const body = { email: 'test@example.com', password: 'Pass123!' };
      const expected = {
        user: { id: '1' },
        accessToken: 'jwt',
        refreshToken: 'rt',
        expiresIn: 900,
      };
      (authService.login as jest.Mock).mockResolvedValue(expected);

      const result = await controller.login(body);
      expect(authService.login).toHaveBeenCalledWith(body.email, body.password);
      expect(result).toEqual(expected);
    });
  });

  describe('refresh', () => {
    it('should call authService.refresh with refreshToken', async () => {
      const body = { refreshToken: 'valid-rt' };
      const expected = {
        accessToken: 'new-jwt',
        refreshToken: 'new-rt',
        expiresIn: 900,
      };
      (authService.refresh as jest.Mock).mockResolvedValue(expected);

      const result = await controller.refresh(body);
      expect(authService.refresh).toHaveBeenCalledWith('valid-rt');
      expect(result).toEqual(expected);
    });
  });

  describe('logout', () => {
    it('should call authService.logout with refreshToken', async () => {
      const body = { refreshToken: 'valid-rt' };
      (authService.logout as jest.Mock).mockResolvedValue(undefined);

      await controller.logout(body);
      expect(authService.logout).toHaveBeenCalledWith('valid-rt');
    });
  });

  describe('me', () => {
    it('should return user profile without passwordHash', async () => {
      const userProfile = {
        id: 'user-1',
        email: 'test@example.com',
        firstName: 'Test',
      };
      (authService.getCurrentUser as jest.Mock).mockReturnValue(userProfile);

      const jwtPayload = {
        sub: 'user-1',
        email: 'test@example.com',
        role: 'guest',
      };
      const result = await controller.me(jwtPayload);

      expect(authService.getCurrentUser).toHaveBeenCalledWith('user-1');
      expect(result).not.toHaveProperty('passwordHash');
      expect(result).toHaveProperty('email', 'test@example.com');
    });

    it('should throw NotFoundException if user not found', async () => {
      (authService.getCurrentUser as jest.Mock).mockImplementation(() => {
        throw new NotFoundException('Usuário não encontrado');
      });

      const jwtPayload = {
        sub: 'non-existent',
        email: 'test@example.com',
        role: 'guest',
      };
      await expect(controller.me(jwtPayload)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
