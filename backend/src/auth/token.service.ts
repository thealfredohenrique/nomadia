import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { User, JwtPayload } from '../common/types';
import {
  ACCESS_TOKEN_EXPIRY_SECONDS,
  REFRESH_TOKEN_TTL_MS,
} from '../common/constants';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class TokenService {
  private readonly logger = new Logger(TokenService.name);
  private refreshTokens: Map<string, { userId: string; expiresAt: number }> =
    new Map();

  constructor(private readonly jwtService: JwtService) {}

  generateTokens(user: User) {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = this.jwtService.sign(payload);
    const refreshToken = uuidv4();
    this.refreshTokens.set(refreshToken, {
      userId: user.id,
      expiresAt: Date.now() + REFRESH_TOKEN_TTL_MS,
    });

    this.logger.log(`Tokens generated for user: ${user.id}`);
    return {
      accessToken,
      refreshToken,
      expiresIn: ACCESS_TOKEN_EXPIRY_SECONDS,
    };
  }

  validateRefreshToken(
    token: string,
  ): { userId: string; expiresAt: number } | undefined {
    const entry = this.refreshTokens.get(token);
    if (!entry || entry.expiresAt <= Date.now()) {
      if (entry) this.refreshTokens.delete(token);
      return undefined;
    }
    return entry;
  }

  revokeRefreshToken(token: string): void {
    this.refreshTokens.delete(token);
  }
}
