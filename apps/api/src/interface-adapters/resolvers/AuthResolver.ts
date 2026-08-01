import type { IRegisterUseCase } from '#src/use-cases/auth/IRegisterUseCase.js';
import type { ILoginUseCase } from '#src/use-cases/auth/ILoginUseCase.js';
import type { ILoginWithTotpUseCase } from '#src/use-cases/auth/ILoginWithTotpUseCase.js';
import type { IRequestPasswordResetUseCase } from '#src/use-cases/auth/IRequestPasswordResetUseCase.js';
import type { IResetPasswordUseCase } from '#src/use-cases/auth/IResetPasswordUseCase.js';
import type { IVerifyEmailUseCase } from '#src/use-cases/auth/IVerifyEmailUseCase.js';
import type { ITokenService, TokenPair } from '#src/use-cases/ports/ITokenService.js';
import type { CreateSessionUseCase } from '#src/use-cases/sessions/CreateSessionUseCase.js';
import type { RotateRefreshTokenUseCase } from '#src/use-cases/sessions/RotateRefreshTokenUseCase.js';

interface Deps {
  registerUseCase: IRegisterUseCase;
  loginUseCase: ILoginUseCase;
  loginWithTotpUseCase: ILoginWithTotpUseCase;
  tokenService: ITokenService;
  requestPasswordResetUseCase: IRequestPasswordResetUseCase;
  resetPasswordUseCase: IResetPasswordUseCase;
  createSessionUseCase: CreateSessionUseCase;
  rotateRefreshTokenUseCase: RotateRefreshTokenUseCase;
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
    return this.deps.tokenService.sign(userId, email, session.id, session.currentRefreshTokenId!);
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
      tokens: this.deps.tokenService.sign(
        user.id,
        user.email,
        session.id,
        session.currentRefreshTokenId!,
      ),
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
    return this.deps.tokenService.sign(
      user.id,
      user.email,
      session.id,
      session.currentRefreshTokenId!,
    );
  }

  async refreshToken(refreshToken: string): Promise<TokenPair> {
    const payload = this.deps.tokenService.verifyRefresh(refreshToken);
    const { newTokenId } = await this.deps.rotateRefreshTokenUseCase.execute({
      sessionId: payload.sid,
      presentedTokenId: payload.jti ?? null,
    });
    return this.deps.tokenService.sign(payload.sub, payload.email, payload.sid, newTokenId);
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
