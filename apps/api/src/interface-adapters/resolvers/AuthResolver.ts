import type { IRegisterUseCase } from '@/use-cases/auth/IRegisterUseCase.js';
import type { ILoginUseCase } from '@/use-cases/auth/ILoginUseCase.js';
import type { IRequestPasswordResetUseCase } from '@/use-cases/auth/IRequestPasswordResetUseCase.js';
import type { IResetPasswordUseCase } from '@/use-cases/auth/IResetPasswordUseCase.js';
import type { IVerifyEmailUseCase } from '@/use-cases/auth/IVerifyEmailUseCase.js';
import type { ITokenService, TokenPair } from '@/use-cases/ports/ITokenService.js';
import type { CreateSessionUseCase } from '@/use-cases/sessions/CreateSessionUseCase.js';
import type { TouchSessionUseCase } from '@/use-cases/sessions/TouchSessionUseCase.js';

interface Deps {
  registerUseCase: IRegisterUseCase;
  loginUseCase: ILoginUseCase;
  tokenService: ITokenService;
  requestPasswordResetUseCase: IRequestPasswordResetUseCase;
  resetPasswordUseCase: IResetPasswordUseCase;
  createSessionUseCase: CreateSessionUseCase;
  touchSessionUseCase: TouchSessionUseCase;
  verifyEmailUseCase: IVerifyEmailUseCase;
}

export interface DeviceInfo {
  userAgent: string | null;
  ipAddress: string | null;
}

export class AuthResolver {
  constructor(private readonly deps: Deps) {}

  async register(email: string, password: string, device: DeviceInfo): Promise<TokenPair> {
    const { userId } = await this.deps.registerUseCase.execute({ email, password });
    const session = await this.deps.createSessionUseCase.execute({ userId, ...device });
    return this.deps.tokenService.sign(userId, email, session.id);
  }

  async login(email: string, password: string, device: DeviceInfo): Promise<TokenPair> {
    const user = await this.deps.loginUseCase.execute({
      email,
      password,
      ipAddress: device.ipAddress,
      userAgent: device.userAgent,
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

  async requestPasswordReset(email: string, ipAddress: string | null): Promise<void> {
    await this.deps.requestPasswordResetUseCase.execute({ email, ipAddress });
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    await this.deps.resetPasswordUseCase.execute({ token, newPassword });
  }
}
