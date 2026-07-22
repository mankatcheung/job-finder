import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthResolver } from '@/interface-adapters/resolvers/AuthResolver.js';
import { makeUser } from '@/__tests__/helpers/mocks.js';
import type { IRegisterUseCase } from '@/use-cases/auth/IRegisterUseCase.js';
import type { ILoginUseCase } from '@/use-cases/auth/ILoginUseCase.js';
import type { IRequestPasswordResetUseCase } from '@/use-cases/auth/IRequestPasswordResetUseCase.js';
import type { IResetPasswordUseCase } from '@/use-cases/auth/IResetPasswordUseCase.js';
import type { ITokenService } from '@/use-cases/ports/ITokenService.js';

const makeRegisterUseCase = (overrides?: Partial<IRegisterUseCase>): IRegisterUseCase => ({
  execute: vi.fn(),
  ...overrides,
});

const makeLoginUseCase = (overrides?: Partial<ILoginUseCase>): ILoginUseCase => ({
  execute: vi.fn(),
  ...overrides,
});

const makeRequestPasswordResetUseCase = (
  overrides?: Partial<IRequestPasswordResetUseCase>,
): IRequestPasswordResetUseCase => ({
  execute: vi.fn().mockResolvedValue(undefined),
  ...overrides,
});

const makeResetPasswordUseCase = (
  overrides?: Partial<IResetPasswordUseCase>,
): IResetPasswordUseCase => ({
  execute: vi.fn().mockResolvedValue(undefined),
  ...overrides,
});

const makeTokenService = (overrides?: Partial<ITokenService>): ITokenService => ({
  sign: vi.fn().mockReturnValue({ accessToken: 'access-token', refreshToken: 'refresh-token' }),
  verifyRefresh: vi.fn(),
  ...overrides,
});

const baseDeps = () => ({
  registerUseCase: makeRegisterUseCase(),
  loginUseCase: makeLoginUseCase(),
  tokenService: makeTokenService(),
  requestPasswordResetUseCase: makeRequestPasswordResetUseCase(),
  resetPasswordUseCase: makeResetPasswordUseCase(),
});

describe('AuthResolver', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('register', () => {
    it('calls registerUseCase and returns a token pair', async () => {
      const registerUseCase = makeRegisterUseCase({
        execute: vi.fn().mockResolvedValue({ userId: 'user-1', email: 'test@example.com' }),
      });
      const tokenService = makeTokenService();

      const resolver = new AuthResolver({ ...baseDeps(), registerUseCase, tokenService });

      const result = await resolver.register('test@example.com', 'password123');

      expect(registerUseCase.execute).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
      expect(tokenService.sign).toHaveBeenCalledWith('user-1', 'test@example.com');
      expect(result).toEqual({ accessToken: 'access-token', refreshToken: 'refresh-token' });
    });
  });

  describe('login', () => {
    it('calls loginUseCase and returns a token pair', async () => {
      const user = makeUser();
      const loginUseCase = makeLoginUseCase({
        execute: vi.fn().mockResolvedValue(user),
      });
      const tokenService = makeTokenService();

      const resolver = new AuthResolver({ ...baseDeps(), loginUseCase, tokenService });

      const result = await resolver.login('test@example.com', 'password123');

      expect(loginUseCase.execute).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
      expect(tokenService.sign).toHaveBeenCalledWith(user.id, user.email);
      expect(result).toEqual({ accessToken: 'access-token', refreshToken: 'refresh-token' });
    });
  });

  describe('refreshToken', () => {
    it('verifies the refresh token and returns a new token pair', () => {
      const tokenService = makeTokenService({
        verifyRefresh: vi.fn().mockReturnValue({ sub: 'user-1', email: 'test@example.com' }),
      });

      const resolver = new AuthResolver({ ...baseDeps(), tokenService });

      const result = resolver.refreshToken('valid-refresh-token');

      expect(tokenService.verifyRefresh).toHaveBeenCalledWith('valid-refresh-token');
      expect(tokenService.sign).toHaveBeenCalledWith('user-1', 'test@example.com');
      expect(result).toEqual({ accessToken: 'access-token', refreshToken: 'refresh-token' });
    });

    it('throws UNAUTHORIZED when the refresh token is invalid', () => {
      const tokenService = makeTokenService({
        verifyRefresh: vi.fn().mockImplementation(() => {
          throw Object.assign(new Error('Invalid refresh token'), { code: 'UNAUTHORIZED' });
        }),
      });

      const resolver = new AuthResolver({ ...baseDeps(), tokenService });

      const err = (() => {
        try {
          resolver.refreshToken('expired-token');
        } catch (e) {
          return e;
        }
      })();

      expect(err).toBeInstanceOf(Error);
      expect((err as { code: string }).code).toBe('UNAUTHORIZED');
    });
  });

  describe('requestPasswordReset', () => {
    it('delegates to requestPasswordResetUseCase with the given email', async () => {
      const requestPasswordResetUseCase = makeRequestPasswordResetUseCase();
      const resolver = new AuthResolver({ ...baseDeps(), requestPasswordResetUseCase });

      await resolver.requestPasswordReset('test@example.com');

      expect(requestPasswordResetUseCase.execute).toHaveBeenCalledWith({
        email: 'test@example.com',
      });
    });
  });

  describe('resetPassword', () => {
    it('delegates to resetPasswordUseCase with the token and new password', async () => {
      const resetPasswordUseCase = makeResetPasswordUseCase();
      const resolver = new AuthResolver({ ...baseDeps(), resetPasswordUseCase });

      await resolver.resetPassword('raw-token', 'newPassword123');

      expect(resetPasswordUseCase.execute).toHaveBeenCalledWith({
        token: 'raw-token',
        newPassword: 'newPassword123',
      });
    });

    it('propagates errors from the use case', async () => {
      const err = Object.assign(new Error('Invalid or expired reset link'), {
        code: 'UNAUTHORIZED',
      });
      const resetPasswordUseCase = makeResetPasswordUseCase({
        execute: vi.fn().mockRejectedValue(err),
      });
      const resolver = new AuthResolver({ ...baseDeps(), resetPasswordUseCase });

      await expect(resolver.resetPassword('bad-token', 'newPassword123')).rejects.toMatchObject({
        code: 'UNAUTHORIZED',
      });
    });
  });
});
