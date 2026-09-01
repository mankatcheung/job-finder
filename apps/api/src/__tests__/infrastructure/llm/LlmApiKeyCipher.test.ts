import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ENV } from '#src/infrastructure/config/constants.js';
import { LlmApiKeyCipher } from '#src/infrastructure/llm/LlmApiKeyCipher.js';

describe('LlmApiKeyCipher', () => {
  const originalKey = process.env[ENV.LLM_API_KEY_ENCRYPTION_KEY];
  const cipher = new LlmApiKeyCipher();

  beforeEach(() => {
    process.env[ENV.LLM_API_KEY_ENCRYPTION_KEY] = 'test-encryption-key-not-for-production';
  });

  afterEach(() => {
    if (originalKey === undefined) {
      delete process.env[ENV.LLM_API_KEY_ENCRYPTION_KEY];
    } else {
      process.env[ENV.LLM_API_KEY_ENCRYPTION_KEY] = originalKey;
    }
  });

  describe('encrypt / decrypt', () => {
    it('decrypts back to the original plaintext', () => {
      const apiKey = 'sk-or-v1-abc123';

      const encrypted = cipher.encrypt(apiKey);
      const decrypted = cipher.decrypt(encrypted);

      expect(decrypted).toBe(apiKey);
    });

    it('does not store the plaintext key in the ciphertext', () => {
      const apiKey = 'sk-or-v1-abc123';

      const encrypted = cipher.encrypt(apiKey);

      expect(encrypted).not.toContain(apiKey);
    });

    it('produces different ciphertext for the same plaintext on each call (random IV)', () => {
      const apiKey = 'sk-or-v1-abc123';

      const first = cipher.encrypt(apiKey);
      const second = cipher.encrypt(apiKey);

      expect(first).not.toBe(second);
      expect(cipher.decrypt(first)).toBe(apiKey);
      expect(cipher.decrypt(second)).toBe(apiKey);
    });

    it('throws when the ciphertext has been tampered with', () => {
      const apiKey = 'sk-or-v1-abc123';
      const encrypted = cipher.encrypt(apiKey);
      const tamperedBytes = Buffer.from(encrypted, 'base64');
      tamperedBytes[tamperedBytes.length - 1] ^= 0xff;
      const tampered = tamperedBytes.toString('base64');

      expect(() => cipher.decrypt(tampered)).toThrow();
    });

    it('throws a clear error when LLM_API_KEY_ENCRYPTION_KEY is not configured', () => {
      delete process.env[ENV.LLM_API_KEY_ENCRYPTION_KEY];

      expect(() => cipher.encrypt('sk-or-v1-abc123')).toThrow(/LLM_API_KEY_ENCRYPTION_KEY/);
    });
  });
});
