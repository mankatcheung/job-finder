import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthResolver } from '@/interface-adapters/resolvers/AuthResolver.js';
import { makeUser } from '@/__tests__/helpers/mocks.js';
import type { IRegisterUseCase } from '@/use-cases/auth/IRegisterUseCase.js';
import type { ILoginUseCase } from '@/use-cases/auth/ILoginUseCase.js';
import type { ILoginWithTotpUseCase } from '@/use-cases/auth/ILoginWithTotpUseCase.js';
import type { ITokenService } from '@/use-cases/ports/ITokenService.js';

const makeRegisterUseCase = (overrides?: Partial<IRegisterUseCase>): IRegisterUseCase => ({
  execute: vi.fn(),
  ...overrides,
});

const makeLoginUseCase = (overrides?: Partial<ILoginUseCase>): ILoginUseCase => ({
  execute: vi.fn(),
  ...overrides,
});

const makeLoginWithTotpUseCase = (
  overrides?: Partial<ILoginWithTotpUseCase>,
): ILoginWithTotpUseCase => ({
  execute: vi.fn(),
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
  loginWithTotpUseCase: makeLoginWithTotpUseCase(),
  tokenService: makeTokenService(),
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
    it('signs tokens and returns totpRequired: false for a user without 2FA', async () => {
      const user = makeUser({ totpEnabled: false });
      const loginUseCase = makeLoginUseCase({ execute: vi.fn().mockResolvedValue(user) });
      const tokenService = makeTokenService();

      const resolver = new AuthResolver({ ...baseDeps(), loginUseCase, tokenService });

      const result = await resolver.login('test@example.com', 'password123');

      expect(loginUseCase.execute).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
      expect(tokenService.sign).toHaveBeenCalledWith(user.id, user.email);
      expect(result).toEqual({
        totpRequired: false,
        tokens: { accessToken: 'access-token', refreshToken: 'refresh-token' },
      });
    });

    it('does not sign tokens and returns totpRequired: true for a user with 2FA enabled', async () => {
      const user = makeUser({ totpEnabled: true });
      const loginUseCase = makeLoginUseCase({ execute: vi.fn().mockResolvedValue(user) });
      const tokenService = makeTokenService();

      const resolver = new AuthResolver({ ...baseDeps(), loginUseCase, tokenService });

      const result = await resolver.login('test@example.com', 'password123');

      expect(tokenService.sign).not.toHaveBeenCalled();
      expect(result).toEqual({ totpRequired: true, tokens: null });
    });
  });

  describe('loginWithTotp', () => {
    it('delegates to loginWithTotpUseCase and signs tokens', async () => {
      const user = makeUser({ totpEnabled: true });
      const loginWithTotpUseCase = makeLoginWithTotpUseCase({
        execute: vi.fn().mockResolvedValue(user),
      });
      const tokenService = makeTokenService();

      const resolver = new AuthResolver({ ...baseDeps(), loginWithTotpUseCase, tokenService });

      const result = await resolver.loginWithTotp('test@example.com', 'password123', '123456');

      expect(loginWithTotpUseCase.execute).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
        code: '123456',
      });
      expect(tokenService.sign).toHaveBeenCalledWith(user.id, user.email);
      expect(result).toEqual({ accessToken: 'access-token', refreshToken: 'refresh-token' });
    });

    it('propagates errors from the use case', async () => {
      const err = Object.assign(new Error('Invalid verification code'), {
        code: 'UNAUTHORIZED',
      });
      const loginWithTotpUseCase = makeLoginWithTotpUseCase({
        execute: vi.fn().mockRejectedValue(err),
      });
      const resolver = new AuthResolver({ ...baseDeps(), loginWithTotpUseCase });

      await expect(
        resolver.loginWithTotp('test@example.com', 'password123', 'bad-code'),
      ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
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
});
