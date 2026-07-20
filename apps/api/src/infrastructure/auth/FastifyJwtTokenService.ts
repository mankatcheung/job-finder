import type { FastifyInstance } from 'fastify';
import type { ITokenService, TokenPair } from '@/use-cases/ports/ITokenService.js';

interface Deps {
  fastify: FastifyInstance;
}

export class FastifyJwtTokenService implements ITokenService {
  constructor(private readonly deps: Deps) {}

  sign(userId: string, email: string): TokenPair {
    const accessToken = this.deps.fastify.jwt.sign(
      { sub: userId, email },
      { expiresIn: '15m' },
    );
    const refreshToken = this.deps.fastify.jwt.sign(
      { sub: userId, email },
      { key: process.env.JWT_REFRESH_SECRET!, expiresIn: '7d' },
    );
    return { accessToken, refreshToken };
  }

  verifyRefresh(token: string): { sub: string; email: string } {
    try {
      return this.deps.fastify.jwt.verify<{ sub: string; email: string }>(token, {
        key: process.env.JWT_REFRESH_SECRET!,
      });
    } catch {
      throw Object.assign(new Error('Invalid refresh token'), { code: 'UNAUTHORIZED' });
    }
  }
}
