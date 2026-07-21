import type { FastifyInstance } from 'fastify';
import type { ITokenService, TokenPair } from '@/use-cases/ports/ITokenService.js';
import { ENV, ERROR_CODES, JWT_EXPIRY } from '@/constants.js';

interface Deps {
  fastify: FastifyInstance;
}

export class FastifyJwtTokenService implements ITokenService {
  constructor(private readonly deps: Deps) {}

  sign(userId: string, email: string): TokenPair {
    const accessToken = this.deps.fastify.jwt.sign(
      { sub: userId, email },
      { expiresIn: JWT_EXPIRY.ACCESS },
    );
    const refreshToken = this.deps.fastify.jwt.sign(
      { sub: userId, email },
      { key: process.env[ENV.JWT_REFRESH_SECRET]!, expiresIn: JWT_EXPIRY.REFRESH },
    );
    return { accessToken, refreshToken };
  }

  verifyRefresh(token: string): { sub: string; email: string } {
    try {
      return this.deps.fastify.jwt.verify<{ sub: string; email: string }>(token, {
        key: process.env[ENV.JWT_REFRESH_SECRET]!,
      });
    } catch {
      throw Object.assign(new Error('Invalid refresh token'), { code: ERROR_CODES.UNAUTHORIZED });
    }
  }
}
