import type { FastifyInstance } from 'fastify';
import type { IRegisterUseCase } from '@/use-cases/auth/IRegisterUseCase.js';
import type { ILoginUseCase } from '@/use-cases/auth/ILoginUseCase.js';

interface Deps {
  registerUseCase: IRegisterUseCase;
  loginUseCase: ILoginUseCase;
  fastify: FastifyInstance;
}

interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export class AuthResolver {
  constructor(private readonly deps: Deps) {}

  async register(email: string, password: string): Promise<TokenPair> {
    const { userId } = await this.deps.registerUseCase.execute({ email, password });
    return this.signTokens(userId, email);
  }

  async login(email: string, password: string): Promise<TokenPair> {
    const user = await this.deps.loginUseCase.execute({ email, password });
    return this.signTokens(user.id, user.email);
  }

  refreshToken(refreshToken: string): TokenPair {
    let payload: { sub: string; email: string };
    try {
      payload = this.deps.fastify.jwt.verify<{ sub: string; email: string }>(refreshToken, {
        key: process.env.JWT_REFRESH_SECRET!,
      });
    } catch {
      throw Object.assign(new Error('Invalid refresh token'), { code: 'UNAUTHORIZED' });
    }
    return this.signTokens(payload.sub, payload.email);
  }

  private signTokens(userId: string, email: string): TokenPair {
    const accessToken = this.deps.fastify.jwt.sign({ sub: userId, email }, { expiresIn: '15m' });
    const refreshToken = this.deps.fastify.jwt.sign(
      { sub: userId, email },
      { key: process.env.JWT_REFRESH_SECRET!, expiresIn: '7d' },
    );
    return { accessToken, refreshToken };
  }
}
