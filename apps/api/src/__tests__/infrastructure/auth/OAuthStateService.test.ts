import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { OAuthStateService } from '#src/infrastructure/auth/OAuthStateService.js';

describe('OAuthStateService', () => {
  const originalSecret = process.env.JWT_SECRET;

  beforeEach(() => {
    process.env.JWT_SECRET = 'test-secret';
  });

  afterEach(() => {
    process.env.JWT_SECRET = originalSecret;
    vi.useRealTimers();
  });

  it('round-trips provider, mode, and userId', () => {
    const service = new OAuthStateService();
    const state = service.issue('google', 'link', 'user-1');

    const parsed = service.verify(state);

    expect(parsed.provider).toBe('google');
    expect(parsed.mode).toBe('link');
    expect(parsed.userId).toBe('user-1');
  });

  it('omits userId for the login mode', () => {
    const service = new OAuthStateService();
    const state = service.issue('github', 'login');

    const parsed = service.verify(state);

    expect(parsed.userId).toBeUndefined();
  });

  it('issues a different nonce each time, so two states for the same input differ', () => {
    const service = new OAuthStateService();
    const first = service.issue('google', 'login');
    const second = service.issue('google', 'login');

    expect(first).not.toBe(second);
  });

  it('throws on a tampered payload', () => {
    const service = new OAuthStateService();
    const state = service.issue('google', 'login');
    const [payload] = state.split('.');
    const tampered = `${payload}.tampered-signature`;

    expect(() => service.verify(tampered)).toThrow('Invalid OAuth state signature');
  });

  it('throws on a malformed state', () => {
    const service = new OAuthStateService();
    expect(() => service.verify('not-a-valid-state')).toThrow('Malformed OAuth state');
  });

  it('throws once the state has expired', () => {
    vi.useFakeTimers();
    const service = new OAuthStateService();
    const state = service.issue('google', 'login');

    vi.advanceTimersByTime(6 * 60 * 1000); // past the 5-minute TTL

    expect(() => service.verify(state)).toThrow('OAuth state expired');
  });
});
