import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MobileOAuthHandoffService } from '#src/infrastructure/auth/MobileOAuthHandoffService.js';

describe('MobileOAuthHandoffService', () => {
  const originalSecret = process.env.JWT_SECRET;

  beforeEach(() => {
    process.env.JWT_SECRET = 'test-secret';
  });

  afterEach(() => {
    process.env.JWT_SECRET = originalSecret;
    vi.useRealTimers();
  });

  it('round-trips the access and refresh tokens', () => {
    const service = new MobileOAuthHandoffService();
    const code = service.issue('access-1', 'refresh-1');

    const parsed = service.verify(code);

    expect(parsed.accessToken).toBe('access-1');
    expect(parsed.refreshToken).toBe('refresh-1');
  });

  it('throws on a tampered payload', () => {
    const service = new MobileOAuthHandoffService();
    const code = service.issue('access-1', 'refresh-1');
    const [payload] = code.split('.');
    const tampered = `${payload}.tampered-signature`;

    expect(() => service.verify(tampered)).toThrow('Invalid OAuth handoff code signature');
  });

  it('throws on a malformed code', () => {
    const service = new MobileOAuthHandoffService();
    expect(() => service.verify('not-a-valid-code')).toThrow('Malformed OAuth handoff code');
  });

  it('throws once the code has expired', () => {
    vi.useFakeTimers();
    const service = new MobileOAuthHandoffService();
    const code = service.issue('access-1', 'refresh-1');

    vi.advanceTimersByTime(2 * 60 * 1000); // past the 1-minute TTL

    expect(() => service.verify(code)).toThrow('OAuth handoff code expired');
  });
});
