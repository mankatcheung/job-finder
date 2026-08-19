import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { McpOAuthConsentService } from '#src/infrastructure/auth/McpOAuthConsentService.js';

describe('McpOAuthConsentService', () => {
  const originalSecret = process.env.JWT_SECRET;
  const service = new McpOAuthConsentService();
  const subject = {
    userId: 'user-1',
    clientId: 'client-1',
    redirectUri: 'http://localhost:6274/callback',
    scope: 'read',
    codeChallenge: 'challenge-1',
  };

  beforeAll(() => {
    process.env.JWT_SECRET = 'test-secret';
  });
  afterAll(() => {
    process.env.JWT_SECRET = originalSecret;
  });

  it('accepts a token it issued for the same authorization request', () => {
    expect(service.verify(service.issue(subject), subject)).toBe(true);
  });

  it('rejects a token issued for a different client', () => {
    const token = service.issue(subject);

    // The whole point: a consent screen shown for one client cannot be used to
    // approve a grant for another.
    expect(service.verify(token, { ...subject, clientId: 'attacker-client' })).toBe(false);
  });

  it('rejects a token issued for a different user, redirect URI, scope, or challenge', () => {
    const token = service.issue(subject);

    expect(service.verify(token, { ...subject, userId: 'user-2' })).toBe(false);
    expect(service.verify(token, { ...subject, redirectUri: 'https://evil.example/cb' })).toBe(
      false,
    );
    expect(service.verify(token, { ...subject, scope: 'full' })).toBe(false);
    expect(service.verify(token, { ...subject, codeChallenge: 'other' })).toBe(false);
  });

  it('rejects a token whose payload was edited to widen the scope', () => {
    const [encoded, signature] = service.issue(subject).split('.');
    const payload = JSON.parse(Buffer.from(encoded, 'base64url').toString()) as Record<
      string,
      unknown
    >;
    const forged = Buffer.from(JSON.stringify({ ...payload, scope: 'full' })).toString('base64url');

    expect(service.verify(`${forged}.${signature}`, { ...subject, scope: 'full' })).toBe(false);
  });

  it('rejects a token signed with a different secret', () => {
    const token = service.issue(subject);
    process.env.JWT_SECRET = 'someone-elses-secret';
    try {
      expect(service.verify(token, subject)).toBe(false);
    } finally {
      process.env.JWT_SECRET = 'test-secret';
    }
  });

  it('rejects an expired token', () => {
    const token = service.issue(subject);
    vi.useFakeTimers();
    try {
      vi.setSystemTime(new Date(Date.now() + 11 * 60 * 1000));
      expect(service.verify(token, subject)).toBe(false);
    } finally {
      vi.useRealTimers();
    }
  });

  it('rejects malformed input rather than throwing', () => {
    expect(service.verify('', subject)).toBe(false);
    expect(service.verify('not-a-token', subject)).toBe(false);
    expect(service.verify('!!!.!!!', subject)).toBe(false);
  });
});
