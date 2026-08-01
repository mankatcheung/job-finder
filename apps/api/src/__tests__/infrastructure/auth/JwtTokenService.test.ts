import { describe, it, expect, vi, beforeEach } from 'vitest';
import { JwtTokenService } from '#src/infrastructure/auth/JwtTokenService.js';
import { ENV, ERROR_CODES } from '#src/constants.js';

const ACCESS_SECRET = 'test-access-secret';
const REFRESH_SECRET = 'test-refresh-secret';

describe('JwtTokenService', () => {
  let service: JwtTokenService;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env[ENV.JWT_SECRET] = ACCESS_SECRET;
    process.env[ENV.JWT_REFRESH_SECRET] = REFRESH_SECRET;
    service = new JwtTokenService();
  });

  describe('sign', () => {
    it('returns an access and refresh token as a TokenPair', () => {
      const result = service.sign('user-1', 'user@example.com', 'session-1', 'refresh-token-id-1');

      expect(typeof result.accessToken).toBe('string');
      expect(typeof result.refreshToken).toBe('string');
      expect(result.accessToken).not.toEqual(result.refreshToken);
    });

    it('signs the access token with the access secret, verifiable via verifyAccess', () => {
      const { accessToken } = service.sign(
        'user-1',
        'user@example.com',
        'session-1',
        'refresh-token-id-1',
      );

      const payload = service.verifyAccess(accessToken);

      expect(payload).toMatchObject({
        sub: 'user-1',
        email: 'user@example.com',
        sid: 'session-1',
      });
    });

    it('signs the refresh token with the refresh secret, verifiable via verifyRefresh', () => {
      const { refreshToken } = service.sign(
        'user-1',
        'user@example.com',
        'session-1',
        'refresh-token-id-1',
      );

      const payload = service.verifyRefresh(refreshToken);

      expect(payload).toMatchObject({
        sub: 'user-1',
        email: 'user@example.com',
        sid: 'session-1',
        jti: 'refresh-token-id-1',
      });
    });
  });

  describe('verifyRefresh', () => {
    it('throws an UNAUTHORIZED-coded error when verification fails', () => {
      expect(() => service.verifyRefresh('not-a-real-token')).toThrow('Invalid refresh token');

      try {
        service.verifyRefresh('not-a-real-token');
        expect.unreachable();
      } catch (err) {
        expect((err as { code?: string }).code).toBe(ERROR_CODES.UNAUTHORIZED);
      }
    });

    it('rejects a token signed with the access secret', () => {
      const { accessToken } = service.sign(
        'user-1',
        'user@example.com',
        'session-1',
        'refresh-token-id-1',
      );

      expect(() => service.verifyRefresh(accessToken)).toThrow('Invalid refresh token');
    });
  });

  describe('verifyAccess', () => {
    it('throws when verification fails', () => {
      expect(() => service.verifyAccess('not-a-real-token')).toThrow();
    });

    it('rejects a token signed with the refresh secret', () => {
      const { refreshToken } = service.sign(
        'user-1',
        'user@example.com',
        'session-1',
        'refresh-token-id-1',
      );

      expect(() => service.verifyAccess(refreshToken)).toThrow();
    });
  });
});
