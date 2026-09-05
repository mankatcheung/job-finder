/// <reference types="node" />
import { createHash } from 'crypto';

// expo-crypto's native module isn't backed in the jest-expo test
// environment (getRandomBytesAsync/digestStringAsync resolve to zeroed/empty
// stand-ins rather than throwing), so it's mocked here with real digests —
// otherwise every assertion below would pass against a broken implementation.
jest.mock('expo-crypto', () => {
  const nodeCrypto: typeof import('crypto') = require('crypto');
  return {
    getRandomBytesAsync: (byteCount: number) =>
      Promise.resolve(new Uint8Array(nodeCrypto.randomBytes(byteCount))),
    digestStringAsync: (_algorithm: unknown, data: string) =>
      Promise.resolve(nodeCrypto.createHash('sha256').update(data).digest('base64')),
    CryptoDigestAlgorithm: { SHA256: 'SHA-256' },
    CryptoEncoding: { BASE64: 'base64' },
  };
});

import { createPkcePair } from '../pkce';

describe('createPkcePair', () => {
  it('derives challenge as base64url(SHA-256(verifier)), matching the API', async () => {
    const { verifier, challenge } = await createPkcePair();

    expect(challenge).toBe(createHash('sha256').update(verifier).digest('base64url'));
  });

  it('produces a verifier within RFC 7636 length bounds using only unreserved characters', async () => {
    const { verifier } = await createPkcePair();

    expect(verifier).toMatch(/^[A-Za-z0-9\-_]{43,128}$/);
  });

  it('generates a different pair every call', async () => {
    const first = await createPkcePair();
    const second = await createPkcePair();

    expect(first.verifier).not.toBe(second.verifier);
    expect(first.challenge).not.toBe(second.challenge);
  });
});
