import { describe, it, expect } from 'vitest';
import { createHash } from 'crypto';
import { createPkcePair, deriveCodeChallenge } from '#src/infrastructure/auth/pkce.js';

describe('pkce', () => {
  it('derives the challenge as the base64url SHA-256 of the verifier', () => {
    // The whole guarantee: the challenge is a one-way function of the
    // verifier, so capturing the challenge in transit reveals nothing.
    const { verifier, challenge } = createPkcePair();

    expect(challenge).toBe(createHash('sha256').update(verifier).digest('base64url'));
  });

  it('produces a verifier within the length RFC 7636 allows', () => {
    const { verifier } = createPkcePair();

    expect(verifier.length).toBeGreaterThanOrEqual(43);
    expect(verifier.length).toBeLessThanOrEqual(128);
  });

  it('uses only unreserved characters, so nothing needs encoding in transit', () => {
    const { verifier, challenge } = createPkcePair();

    expect(verifier).toMatch(/^[A-Za-z0-9\-._~]+$/);
    expect(challenge).toMatch(/^[A-Za-z0-9\-._~]+$/);
  });

  it('never contains a dot, which the cookie uses as its separator', () => {
    // The state nonce and the verifier share one cookie, split on '.'.
    for (let i = 0; i < 50; i += 1) {
      expect(createPkcePair().verifier).not.toContain('.');
    }
  });

  it('mints a different pair every time', () => {
    expect(createPkcePair().verifier).not.toBe(createPkcePair().verifier);
  });

  it('deriveCodeChallenge is stable for the same verifier', () => {
    expect(deriveCodeChallenge('a-fixed-verifier')).toBe(deriveCodeChallenge('a-fixed-verifier'));
  });
});
