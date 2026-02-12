import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;
  let usersService: UsersService;

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
          },
        },
        {
          provide: UsersService,
          useValue: {
            findById: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
    usersService = module.get<UsersService>(UsersService);
  });

  describe('register', () => {
    it('should call authService.register with body', async () => {
      const body = {
        email: 'test@example.com',
        password: 'Pass123!',
        firstName: 'Test',
        lastName: 'User',
      };
      const expected = { user: { id: '1', email: body.email }, accessToken: 'jwt', refreshToken: 'rt', expiresIn: 900 };
      (authService.register as jest.Mock).mockResolvedValue(expected);

      const result = await controller.register(body);
      expect(authService.register).toHaveBeenCalledWith(body);
      expect(result).toEqual(expected);
    });
  });

  describe('login', () => {
    it('should call authService.login with email and password', async () => {
      const body = { email: 'test@example.com', password: 'Pass123!' };
      const expected = { user: { id: '1' }, accessToken: 'jwt', refreshToken: 'rt', expiresIn: 900 };
      (authService.login as jest.Mock).mockResolvedValue(expected);

      const result = await controller.login(body);
      expect(authService.login).toHaveBeenCalledWith(body.email, body.password);
      expect(result).toEqual(expected);
    });
  });

  describe('refresh', () => {
    it('should call authService.refresh with refreshToken', async () => {
      const body = { refreshToken: 'valid-rt' };
      const expected = { accessToken: 'new-jwt', refreshToken: 'new-rt', expiresIn: 900 };
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
      const user = {
        id: 'user-1',
        email: 'test@example.com',
        passwordHash: 'secret',
        firstName: 'Test',
      };
      (usersService.findById as jest.Mock).mockReturnValue(user);

      const req = { user: { sub: 'user-1' } };
      const result = await controller.me(req);

      expect(result).not.toHaveProperty('passwordHash');
      expect(result).toHaveProperty('email', 'test@example.com');
    });

    it('should return null if user not found', async () => {
      (usersService.findById as jest.Mock).mockReturnValue(undefined);

      const req = { user: { sub: 'non-existent' } };
      const result = await controller.me(req);
      expect(result).toBeNull();
    });
  });
});
