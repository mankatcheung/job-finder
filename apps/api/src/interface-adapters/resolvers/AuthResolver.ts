import type { IRegisterUseCase } from '@/use-cases/auth/IRegisterUseCase.js';
import type { ILoginUseCase } from '@/use-cases/auth/ILoginUseCase.js';
import type { ILoginWithTotpUseCase } from '@/use-cases/auth/ILoginWithTotpUseCase.js';
import type { IVerifyEmailUseCase } from '@/use-cases/auth/IVerifyEmailUseCase.js';
import type { ITokenService, TokenPair } from '@/use-cases/ports/ITokenService.js';
import type { CreateSessionUseCase } from '@/use-cases/sessions/CreateSessionUseCase.js';
import type { TouchSessionUseCase } from '@/use-cases/sessions/TouchSessionUseCase.js';

interface Deps {
  registerUseCase: IRegisterUseCase;
  loginUseCase: ILoginUseCase;
  loginWithTotpUseCase: ILoginWithTotpUseCase;
  tokenService: ITokenService;
  createSessionUseCase: CreateSessionUseCase;
  touchSessionUseCase: TouchSessionUseCase;
  verifyEmailUseCase: IVerifyEmailUseCase;
}

export interface DeviceInfo {
  userAgent: string | null;
  ipAddress: string | null;
}

export interface LoginResult {
  totpRequired: boolean;
  tokens: TokenPair | null;
}

export class AuthResolver {
  constructor(private readonly deps: Deps) {}

  async register(email: string, password: string, device: DeviceInfo): Promise<TokenPair> {
    const { userId } = await this.deps.registerUseCase.execute({ email, password });
    const session = await this.deps.createSessionUseCase.execute({ userId, ...device });
    return this.deps.tokenService.sign(userId, email, session.id);
  }

  async login(email: string, password: string, device: DeviceInfo): Promise<LoginResult> {
    const user = await this.deps.loginUseCase.execute({
      email,
      password,
      ipAddress: device.ipAddress,
      userAgent: device.userAgent,
    });
    if (user.totpEnabled) {
      // Login isn't complete until TOTP is verified — no session yet.
      return { totpRequired: true, tokens: null };
    }
    const session = await this.deps.createSessionUseCase.execute({ userId: user.id, ...device });
    return {
      totpRequired: false,
      tokens: this.deps.tokenService.sign(user.id, user.email, session.id),
    };
  }

  async loginWithTotp(
    email: string,
    password: string,
    code: string,
    device: DeviceInfo,
  ): Promise<TokenPair> {
    const user = await this.deps.loginWithTotpUseCase.execute({
      email,
      password,
      code,
      ipAddress: device.ipAddress,
    });
    const session = await this.deps.createSessionUseCase.execute({ userId: user.id, ...device });
    return this.deps.tokenService.sign(user.id, user.email, session.id);
  }

  async refreshToken(refreshToken: string): Promise<TokenPair> {
    const payload = this.deps.tokenService.verifyRefresh(refreshToken);
    await this.deps.touchSessionUseCase.execute(payload.sid);
    return this.deps.tokenService.sign(payload.sub, payload.email, payload.sid);
  }

  async verifyEmail(token: string): Promise<void> {
    await this.deps.verifyEmailUseCase.execute({ token });
  }
}
