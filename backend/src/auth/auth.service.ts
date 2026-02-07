import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { User, JwtPayload } from '../common/types';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class AuthService {
  private refreshTokens: Map<string, string> = new Map();

  constructor(
    private readonly jwtService: JwtService,
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
      passwordHash: `$2b$12$mock.${dto.password}`,
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

    const tokens = this.generateTokens(user);
    return {
      user: this.sanitizeUser(user),
      ...tokens,
    };
  }

  async login(email: string, password: string) {
    const user = this.usersService.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    // Mock password check
    if (user.passwordHash !== `$2b$12$mock.${password}`) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    if (user.accountStatus !== 'active') {
      throw new UnauthorizedException('Conta suspensa ou banida');
    }

    const tokens = this.generateTokens(user);
    return {
      user: this.sanitizeUser(user),
      ...tokens,
    };
  }

  async refresh(refreshToken: string) {
    const userId = this.refreshTokens.get(refreshToken);
    if (!userId) {
      throw new UnauthorizedException('Refresh token inválido');
    }

    const user = this.usersService.findById(userId);
    if (!user) {
      throw new UnauthorizedException('Usuário não encontrado');
    }

    this.refreshTokens.delete(refreshToken);
    const tokens = this.generateTokens(user);
    return tokens;
  }

  async logout(refreshToken: string) {
    this.refreshTokens.delete(refreshToken);
  }

  private generateTokens(user: User) {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = this.jwtService.sign(payload);
    const refreshToken = uuidv4();
    this.refreshTokens.set(refreshToken, user.id);

    return {
      accessToken,
      refreshToken,
      expiresIn: 900,
    };
  }

  private sanitizeUser(user: User) {
    const { passwordHash, ...rest } = user;
    return rest;
  }
}
