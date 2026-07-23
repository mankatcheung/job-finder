import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthResolver } from '@/interface-adapters/resolvers/AuthResolver.js';
import { makeUser, makeSession } from '@/__tests__/helpers/mocks.js';
import type { IRegisterUseCase } from '@/use-cases/auth/IRegisterUseCase.js';
import type { ILoginUseCase } from '@/use-cases/auth/ILoginUseCase.js';
import type { IRequestPasswordResetUseCase } from '@/use-cases/auth/IRequestPasswordResetUseCase.js';
import type { IResetPasswordUseCase } from '@/use-cases/auth/IResetPasswordUseCase.js';
import type { IVerifyEmailUseCase } from '@/use-cases/auth/IVerifyEmailUseCase.js';
import type { ITokenService } from '@/use-cases/ports/ITokenService.js';
import type { CreateSessionUseCase } from '@/use-cases/sessions/CreateSessionUseCase.js';
import type { TouchSessionUseCase } from '@/use-cases/sessions/TouchSessionUseCase.js';

const stub = <T>(methods: Partial<T>): T => methods as T;

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

const makeVerifyEmailUseCase = (overrides?: Partial<IVerifyEmailUseCase>): IVerifyEmailUseCase => ({
  execute: vi.fn().mockResolvedValue(undefined),
  ...overrides,
});

const makeTokenService = (overrides?: Partial<ITokenService>): ITokenService => ({
  sign: vi.fn().mockReturnValue({ accessToken: 'access-token', refreshToken: 'refresh-token' }),
  verifyRefresh: vi.fn(),
  ...overrides,
});

const device = { userAgent: 'test-agent', ipAddress: '127.0.0.1' };

const baseDeps = () => ({
  registerUseCase: makeRegisterUseCase(),
  loginUseCase: makeLoginUseCase(),
  tokenService: makeTokenService(),
  requestPasswordResetUseCase: makeRequestPasswordResetUseCase(),
  resetPasswordUseCase: makeResetPasswordUseCase(),
  createSessionUseCase: stub<CreateSessionUseCase>({
    execute: vi.fn().mockResolvedValue(makeSession()),
  }),
  touchSessionUseCase: stub<TouchSessionUseCase>({
    execute: vi.fn().mockResolvedValue(makeSession()),
  }),
  verifyEmailUseCase: makeVerifyEmailUseCase(),
});

describe('AuthResolver', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('register', () => {
    it('registers, creates a session, and returns a token pair', async () => {
      const registerUseCase = makeRegisterUseCase({
        execute: vi.fn().mockResolvedValue({ userId: 'user-1', email: 'test@example.com' }),
      });
      const tokenService = makeTokenService();
      const createSessionUseCase = stub<CreateSessionUseCase>({
        execute: vi.fn().mockResolvedValue(makeSession({ id: 'session-1' })),
      });

      const resolver = new AuthResolver({
        ...baseDeps(),
        registerUseCase,
        tokenService,
        createSessionUseCase,
      });

      const result = await resolver.register('test@example.com', 'password123', device);

      expect(registerUseCase.execute).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
      expect(createSessionUseCase.execute).toHaveBeenCalledWith({ userId: 'user-1', ...device });
      expect(tokenService.sign).toHaveBeenCalledWith('user-1', 'test@example.com', 'session-1');
      expect(result).toEqual({ accessToken: 'access-token', refreshToken: 'refresh-token' });
    });
  });

  describe('login', () => {
    it('logs in, creates a session, and returns a token pair', async () => {
      const user = makeUser();
      const loginUseCase = makeLoginUseCase({ execute: vi.fn().mockResolvedValue(user) });
      const tokenService = makeTokenService();
      const createSessionUseCase = stub<CreateSessionUseCase>({
        execute: vi.fn().mockResolvedValue(makeSession({ id: 'session-1' })),
      });

      const resolver = new AuthResolver({
        ...baseDeps(),
        loginUseCase,
        tokenService,
        createSessionUseCase,
      });

      const result = await resolver.login('test@example.com', 'password123', device);

      expect(loginUseCase.execute).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
        ipAddress: '127.0.0.1',
        userAgent: 'test-agent',
      });
      expect(createSessionUseCase.execute).toHaveBeenCalledWith({ userId: user.id, ...device });
      expect(tokenService.sign).toHaveBeenCalledWith(user.id, user.email, 'session-1');
      expect(result).toEqual({ accessToken: 'access-token', refreshToken: 'refresh-token' });
    });
  });

  describe('refreshToken', () => {
    it('verifies the refresh token, touches the session, and returns a new token pair', async () => {
      const tokenService = makeTokenService({
        verifyRefresh: vi
          .fn()
          .mockReturnValue({ sub: 'user-1', email: 'test@example.com', sid: 'session-1' }),
      });
      const touchSessionUseCase = stub<TouchSessionUseCase>({
        execute: vi.fn().mockResolvedValue(makeSession({ id: 'session-1' })),
      });

      const resolver = new AuthResolver({ ...baseDeps(), tokenService, touchSessionUseCase });

      const result = await resolver.refreshToken('valid-refresh-token');

      expect(tokenService.verifyRefresh).toHaveBeenCalledWith('valid-refresh-token');
      expect(touchSessionUseCase.execute).toHaveBeenCalledWith('session-1');
      expect(tokenService.sign).toHaveBeenCalledWith('user-1', 'test@example.com', 'session-1');
      expect(result).toEqual({ accessToken: 'access-token', refreshToken: 'refresh-token' });
    });

    it('throws UNAUTHORIZED when the refresh token is invalid', async () => {
      const tokenService = makeTokenService({
        verifyRefresh: vi.fn().mockImplementation(() => {
          throw Object.assign(new Error('Invalid refresh token'), { code: 'UNAUTHORIZED' });
        }),
      });

      const resolver = new AuthResolver({ ...baseDeps(), tokenService });

      const err = await resolver.refreshToken('expired-token').catch((e) => e);

      expect(err).toBeInstanceOf(Error);
      expect((err as { code: string }).code).toBe('UNAUTHORIZED');
    });

    it('throws UNAUTHORIZED when the session has been revoked', async () => {
      const tokenService = makeTokenService({
        verifyRefresh: vi
          .fn()
          .mockReturnValue({ sub: 'user-1', email: 'test@example.com', sid: 'session-1' }),
      });
      const touchSessionUseCase = stub<TouchSessionUseCase>({
        execute: vi
          .fn()
          .mockRejectedValue(
            Object.assign(new Error('Session revoked or expired'), { code: 'UNAUTHORIZED' }),
          ),
      });

      const resolver = new AuthResolver({ ...baseDeps(), tokenService, touchSessionUseCase });

      const err = await resolver.refreshToken('valid-refresh-token').catch((e) => e);

      expect((err as { code: string }).code).toBe('UNAUTHORIZED');
      expect(tokenService.sign).not.toHaveBeenCalled();
    });
  });

  describe('verifyEmail', () => {
    it('delegates to verifyEmailUseCase with the given token', async () => {
      const verifyEmailUseCase = makeVerifyEmailUseCase();
      const resolver = new AuthResolver({ ...baseDeps(), verifyEmailUseCase });

      await resolver.verifyEmail('raw-token');

      expect(verifyEmailUseCase.execute).toHaveBeenCalledWith({ token: 'raw-token' });
    });

    it('propagates errors from the use case', async () => {
      const err = Object.assign(new Error('Invalid or expired verification link'), {
        code: 'UNAUTHORIZED',
      });
      const verifyEmailUseCase = makeVerifyEmailUseCase({
        execute: vi.fn().mockRejectedValue(err),
      });
      const resolver = new AuthResolver({ ...baseDeps(), verifyEmailUseCase });

      await expect(resolver.verifyEmail('bad-token')).rejects.toMatchObject({
        code: 'UNAUTHORIZED',
      });
    });
  });

  describe('requestPasswordReset', () => {
    it('delegates to requestPasswordResetUseCase with the given email and IP', async () => {
      const requestPasswordResetUseCase = makeRequestPasswordResetUseCase();
      const resolver = new AuthResolver({ ...baseDeps(), requestPasswordResetUseCase });

      await resolver.requestPasswordReset('test@example.com', '127.0.0.1');

      expect(requestPasswordResetUseCase.execute).toHaveBeenCalledWith({
        email: 'test@example.com',
        ipAddress: '127.0.0.1',
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
