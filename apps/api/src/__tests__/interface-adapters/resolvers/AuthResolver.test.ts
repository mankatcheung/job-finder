import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthResolver } from '@/interface-adapters/resolvers/AuthResolver.js';
import { makeUser } from '@/__tests__/helpers/mocks.js';
import type { IRegisterUseCase } from '@/use-cases/auth/IRegisterUseCase.js';
import type { ILoginUseCase } from '@/use-cases/auth/ILoginUseCase.js';

const makeRegisterUseCase = (overrides?: Partial<IRegisterUseCase>): IRegisterUseCase =>
  ({ execute: vi.fn(), ...overrides });

const makeLoginUseCase = (overrides?: Partial<ILoginUseCase>): ILoginUseCase =>
  ({ execute: vi.fn(), ...overrides });

const makeFastify = () => ({
  jwt: {
    sign: vi.fn().mockReturnValue('signed-token'),
    verify: vi.fn(),
  },
});

describe('AuthResolver', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';
  });

  describe('register', () => {
    it('calls registerUseCase and returns a token pair', async () => {
      const registerUseCase = makeRegisterUseCase({
        execute: vi.fn().mockResolvedValue({ userId: 'user-1', email: 'test@example.com' }),
      });
      const fastify = makeFastify();

      const resolver = new AuthResolver({
        registerUseCase,
        loginUseCase: makeLoginUseCase(),
        fastify: fastify as never,
      });

      const result = await resolver.register('test@example.com', 'password123');

      expect(registerUseCase.execute).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
      expect(fastify.jwt.sign).toHaveBeenCalledTimes(2);
      expect(result).toEqual({ accessToken: 'signed-token', refreshToken: 'signed-token' });
    });
  });

  describe('login', () => {
    it('calls loginUseCase and returns a token pair', async () => {
      const user = makeUser();
      const loginUseCase = makeLoginUseCase({
        execute: vi.fn().mockResolvedValue(user),
      });
      const fastify = makeFastify();

      const resolver = new AuthResolver({
        registerUseCase: makeRegisterUseCase(),
        loginUseCase,
        fastify: fastify as never,
      });

      const result = await resolver.login('test@example.com', 'password123');

      expect(loginUseCase.execute).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
      expect(fastify.jwt.sign).toHaveBeenCalledTimes(2);
      expect(result).toEqual({ accessToken: 'signed-token', refreshToken: 'signed-token' });
    });
  });

  describe('refreshToken', () => {
    it('verifies the cookie and returns a new token pair', () => {
      const fastify = makeFastify();
      fastify.jwt.verify.mockReturnValue({ sub: 'user-1', email: 'test@example.com' });

      const resolver = new AuthResolver({
        registerUseCase: makeRegisterUseCase(),
        loginUseCase: makeLoginUseCase(),
        fastify: fastify as never,
      });

      const result = resolver.refreshToken('valid-refresh-token');

      expect(fastify.jwt.verify).toHaveBeenCalledWith(
        'valid-refresh-token',
        expect.objectContaining({ key: expect.any(String) }),
      );
      expect(fastify.jwt.sign).toHaveBeenCalledTimes(2);
      expect(result).toEqual({ accessToken: 'signed-token', refreshToken: 'signed-token' });
    });

    it('throws UNAUTHORIZED when the refresh token is invalid', () => {
      const fastify = makeFastify();
      fastify.jwt.verify.mockImplementation(() => {
        throw new Error('jwt expired');
      });

      const resolver = new AuthResolver({
        registerUseCase: makeRegisterUseCase(),
        loginUseCase: makeLoginUseCase(),
        fastify: fastify as never,
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
