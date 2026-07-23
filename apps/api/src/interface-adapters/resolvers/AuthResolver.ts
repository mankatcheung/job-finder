import type { IRegisterUseCase } from '@/use-cases/auth/IRegisterUseCase.js';
import type { ILoginUseCase } from '@/use-cases/auth/ILoginUseCase.js';
import type { ITokenService, TokenPair } from '@/use-cases/ports/ITokenService.js';

interface Deps {
  registerUseCase: IRegisterUseCase;
  loginUseCase: ILoginUseCase;
  tokenService: ITokenService;
}

export class AuthResolver {
  constructor(private readonly deps: Deps) {}

  async register(email: string, password: string): Promise<TokenPair> {
    const { userId } = await this.deps.registerUseCase.execute({ email, password });
    return this.deps.tokenService.sign(userId, email);
  }

  async login(
    email: string,
    password: string,
    ipAddress?: string | null,
    userAgent?: string | null,
  ): Promise<TokenPair> {
    const user = await this.deps.loginUseCase.execute({ email, password, ipAddress, userAgent });
    return this.deps.tokenService.sign(user.id, user.email);
  }

  refreshToken(refreshToken: string): TokenPair {
    const payload = this.deps.tokenService.verifyRefresh(refreshToken);
    return this.deps.tokenService.sign(payload.sub, payload.email);
  }
}
