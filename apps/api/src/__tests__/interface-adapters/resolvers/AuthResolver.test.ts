import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthResolver } from '@/interface-adapters/resolvers/AuthResolver.js';
import { makeUser } from '@/__tests__/helpers/mocks.js';
import type { IRegisterUseCase } from '@/use-cases/auth/IRegisterUseCase.js';
import type { ILoginUseCase } from '@/use-cases/auth/ILoginUseCase.js';
import type { ITokenService } from '@/use-cases/ports/ITokenService.js';

const makeRegisterUseCase = (overrides?: Partial<IRegisterUseCase>): IRegisterUseCase => ({
  execute: vi.fn(),
  ...overrides,
});

const makeLoginUseCase = (overrides?: Partial<ILoginUseCase>): ILoginUseCase => ({
  execute: vi.fn(),
  ...overrides,
});

const makeTokenService = (overrides?: Partial<ITokenService>): ITokenService => ({
  sign: vi.fn().mockReturnValue({ accessToken: 'access-token', refreshToken: 'refresh-token' }),
  verifyRefresh: vi.fn(),
  ...overrides,
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

      const resolver = new AuthResolver({
        registerUseCase,
        loginUseCase: makeLoginUseCase(),
        tokenService,
      });

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

      const resolver = new AuthResolver({
        registerUseCase: makeRegisterUseCase(),
        loginUseCase,
        tokenService,
      });

      const result = await resolver.login(
        'test@example.com',
        'password123',
        '127.0.0.1',
        'test-agent',
      );

      expect(loginUseCase.execute).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
        ipAddress: '127.0.0.1',
        userAgent: 'test-agent',
      });
      expect(tokenService.sign).toHaveBeenCalledWith(user.id, user.email);
      expect(result).toEqual({ accessToken: 'access-token', refreshToken: 'refresh-token' });
    });

    it('passes undefined ip/userAgent through when omitted', async () => {
      const user = makeUser();
      const loginUseCase = makeLoginUseCase({
        execute: vi.fn().mockResolvedValue(user),
      });
      const tokenService = makeTokenService();

      const resolver = new AuthResolver({
        registerUseCase: makeRegisterUseCase(),
        loginUseCase,
        tokenService,
      });

      await resolver.login('test@example.com', 'password123');

      expect(loginUseCase.execute).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
        ipAddress: undefined,
        userAgent: undefined,
      });
    });
  });

  describe('refreshToken', () => {
    it('verifies the refresh token and returns a new token pair', () => {
      const tokenService = makeTokenService({
        verifyRefresh: vi.fn().mockReturnValue({ sub: 'user-1', email: 'test@example.com' }),
      });

      const resolver = new AuthResolver({
        registerUseCase: makeRegisterUseCase(),
        loginUseCase: makeLoginUseCase(),
        tokenService,
      });

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

      const resolver = new AuthResolver({
        registerUseCase: makeRegisterUseCase(),
        loginUseCase: makeLoginUseCase(),
        tokenService,
      });

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
