import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MobileOAuthHandoffService } from '#src/infrastructure/auth/MobileOAuthHandoffService.js';
import { createPkcePair } from '#src/infrastructure/auth/pkce.js';

describe('MobileOAuthHandoffService', () => {
  const originalSecret = process.env.JWT_SECRET;

  beforeEach(() => {
    process.env.JWT_SECRET = 'test-secret';
  });

  afterEach(() => {
    process.env.JWT_SECRET = originalSecret;
    vi.useRealTimers();
  });

  it('round-trips the access and refresh tokens given the matching PKCE verifier', () => {
    const service = new MobileOAuthHandoffService();
    const { verifier, challenge } = createPkcePair();
    const code = service.issue('access-1', 'refresh-1', challenge);

    const parsed = service.verify(code, verifier);

    expect(parsed.accessToken).toBe('access-1');
    expect(parsed.refreshToken).toBe('refresh-1');
  });

  it('throws on a tampered payload', () => {
    const service = new MobileOAuthHandoffService();
    const { verifier, challenge } = createPkcePair();
    const code = service.issue('access-1', 'refresh-1', challenge);
    const [payload] = code.split('.');
    const tampered = `${payload}.tampered-signature`;

    expect(() => service.verify(tampered, verifier)).toThrow(
      'Invalid OAuth handoff code signature',
    );
  });

  it('throws on a malformed code', () => {
    const service = new MobileOAuthHandoffService();
    const { verifier } = createPkcePair();
    expect(() => service.verify('not-a-valid-code', verifier)).toThrow(
      'Malformed OAuth handoff code',
    );
  });

  it('throws once the code has expired', () => {
    vi.useFakeTimers();
    const service = new MobileOAuthHandoffService();
    const { verifier, challenge } = createPkcePair();
    const code = service.issue('access-1', 'refresh-1', challenge);

    vi.advanceTimersByTime(2 * 60 * 1000); // past the 1-minute TTL

    expect(() => service.verify(code, verifier)).toThrow('OAuth handoff code expired');
  });

  it('throws when the presented verifier does not hash to the challenge that was issued', () => {
    const service = new MobileOAuthHandoffService();
    const { challenge } = createPkcePair();
    const { verifier: wrongVerifier } = createPkcePair();
    const code = service.issue('access-1', 'refresh-1', challenge);

    expect(() => service.verify(code, wrongVerifier)).toThrow(
      'Invalid OAuth handoff PKCE verifier',
    );
  });

  it('throws on a malformed verifier', () => {
    const service = new MobileOAuthHandoffService();
    const { challenge } = createPkcePair();
    const code = service.issue('access-1', 'refresh-1', challenge);

    expect(() => service.verify(code, 'too-short')).toThrow('Invalid OAuth handoff PKCE verifier');
  });
});
