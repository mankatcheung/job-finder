import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { FastifyJwtTokenService } from '@/infrastructure/auth/FastifyJwtTokenService.js';
import { makeFastifyJwt } from '@/__tests__/helpers/mocks.js';
import { ENV, ERROR_CODES, JWT_EXPIRY } from '@/constants.js';

const REFRESH_SECRET = 'test-refresh-secret';

describe('FastifyJwtTokenService', () => {
  let fastifyJwt: ReturnType<typeof makeFastifyJwt>;
  let service: FastifyJwtTokenService;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env[ENV.JWT_REFRESH_SECRET] = REFRESH_SECRET;
    fastifyJwt = makeFastifyJwt();
    service = new FastifyJwtTokenService({ fastify: fastifyJwt as unknown as FastifyInstance });
  });

  describe('sign', () => {
    it('signs an access token with the user payload and ACCESS expiry, no explicit key', () => {
      service.sign('user-1', 'user@example.com', 'session-1');

      expect(fastifyJwt.jwt.sign).toHaveBeenNthCalledWith(
        1,
        { sub: 'user-1', email: 'user@example.com', sid: 'session-1' },
        { expiresIn: JWT_EXPIRY.ACCESS },
      );
    });

    it('signs a refresh token with the refresh secret and REFRESH expiry', () => {
      service.sign('user-1', 'user@example.com', 'session-1');

      expect(fastifyJwt.jwt.sign).toHaveBeenNthCalledWith(
        2,
        { sub: 'user-1', email: 'user@example.com', sid: 'session-1' },
        { key: REFRESH_SECRET, expiresIn: JWT_EXPIRY.REFRESH },
      );
    });

    it('returns both tokens as a TokenPair', () => {
      vi.mocked(fastifyJwt.jwt.sign)
        .mockReturnValueOnce('access-token-value')
        .mockReturnValueOnce('refresh-token-value');

      const result = service.sign('user-1', 'user@example.com', 'session-1');

      expect(result).toEqual({
        accessToken: 'access-token-value',
        refreshToken: 'refresh-token-value',
      });
    });
  });

  describe('verifyRefresh', () => {
    it('verifies against the refresh secret and returns the decoded payload', () => {
      vi.mocked(fastifyJwt.jwt.verify).mockReturnValue({
        sub: 'user-1',
        email: 'user@example.com',
        sid: 'session-1',
      });

      const result = service.verifyRefresh('a-refresh-token');

      expect(fastifyJwt.jwt.verify).toHaveBeenCalledWith('a-refresh-token', {
        key: REFRESH_SECRET,
      });
      expect(result).toEqual({ sub: 'user-1', email: 'user@example.com', sid: 'session-1' });
    });

    it('throws an UNAUTHORIZED-coded error when verification fails', () => {
      vi.mocked(fastifyJwt.jwt.verify).mockImplementation(() => {
        throw new Error('jwt expired');
      });

      expect(() => service.verifyRefresh('bad-token')).toThrow('Invalid refresh token');

      try {
        service.verifyRefresh('bad-token');
        expect.unreachable();
      } catch (err) {
        expect((err as { code?: string }).code).toBe(ERROR_CODES.UNAUTHORIZED);
      }
    });
  });
});
