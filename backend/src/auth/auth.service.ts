import {
  Injectable,
  Logger,
  UnauthorizedException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { User } from '../common/types';
import { TokenService } from './token.service';
import { toPublicUser } from '../common/sanitize';
import { BCRYPT_ROUNDS } from '../common/constants';
import { v4 as uuidv4 } from 'uuid';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly tokenService: TokenService,
    private readonly usersService: UsersService,
  ) {}

  async register(dto: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
    dateOfBirth?: string;
    role?: 'guest' | 'host';
  }) {
    const existing = this.usersService.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException('Email já cadastrado');
    }

    const user: User = {
      id: uuidv4(),
      email: dto.email,
      passwordHash: bcrypt.hashSync(dto.password, BCRYPT_ROUNDS),
      firstName: dto.firstName,
      lastName: dto.lastName,
      phone: dto.phone,
      dateOfBirth: dto.dateOfBirth,
      language: 'pt-BR',
      currency: 'BRL',
      role: dto.role || 'guest',
      isEmailVerified: false,
      isPhoneVerified: false,
      isIdentityVerified: false,
      isSuperhost: false,
      accountStatus: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.usersService.create(user);
    this.logger.log(`User registered: ${user.email}`);

    const tokens = this.tokenService.generateTokens(user);
    return {
      user: toPublicUser(user),
      ...tokens,
    };
  }

  async login(email: string, password: string) {
    const user = this.usersService.findByEmail(email);
    if (!user) {
      this.logger.warn(`Login failed: ${email}`);
      throw new UnauthorizedException('Credenciais inválidas');
    }

    if (!bcrypt.compareSync(password, user.passwordHash)) {
      this.logger.warn(`Login failed: ${email}`);
      throw new UnauthorizedException('Credenciais inválidas');
    }

    if (user.accountStatus !== 'active') {
      throw new UnauthorizedException('Conta suspensa ou banida');
    }

    this.logger.log(`Login successful: ${email}`);
    const tokens = this.tokenService.generateTokens(user);
    return {
      user: toPublicUser(user),
      ...tokens,
    };
  }

  async refresh(refreshToken: string) {
    const entry = this.tokenService.validateRefreshToken(refreshToken);
    if (!entry) {
      this.logger.warn('Invalid refresh token attempt');
      throw new UnauthorizedException('Refresh token inválido');
    }

    const user = this.usersService.findById(entry.userId);
    if (!user) {
      throw new UnauthorizedException('Usuário não encontrado');
    }

    this.tokenService.revokeRefreshToken(refreshToken);
    const tokens = this.tokenService.generateTokens(user);
    return tokens;
  }

  async logout(refreshToken: string) {
    this.tokenService.revokeRefreshToken(refreshToken);
  }

  getCurrentUser(userId: string) {
    const user = this.usersService.findById(userId);
    if (!user) throw new NotFoundException('Usuário não encontrado');
    return toPublicUser(user);
  }
}
