import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ENV } from '@/constants.js';
import { encryptTotpSecret, decryptTotpSecret } from '@/infrastructure/auth/totpSecretCrypto.js';

describe('totpSecretCrypto', () => {
  const originalKey = process.env[ENV.TOTP_ENCRYPTION_KEY];

  beforeEach(() => {
    process.env[ENV.TOTP_ENCRYPTION_KEY] = 'test-encryption-key-not-for-production';
  });

  afterEach(() => {
    if (originalKey === undefined) {
      delete process.env[ENV.TOTP_ENCRYPTION_KEY];
    } else {
      process.env[ENV.TOTP_ENCRYPTION_KEY] = originalKey;
    }
  });

  it('decrypts back to the original plaintext', () => {
    const secret = 'JBSWY3DPEHPK3PXP';

    const encrypted = encryptTotpSecret(secret);
    const decrypted = decryptTotpSecret(encrypted);

    expect(decrypted).toBe(secret);
  });

  it('does not store the plaintext secret in the ciphertext', () => {
    const secret = 'JBSWY3DPEHPK3PXP';

    const encrypted = encryptTotpSecret(secret);

    expect(encrypted).not.toContain(secret);
  });

  it('produces different ciphertext for the same plaintext on each call (random IV)', () => {
    const secret = 'JBSWY3DPEHPK3PXP';

    const first = encryptTotpSecret(secret);
    const second = encryptTotpSecret(secret);

    expect(first).not.toBe(second);
    expect(decryptTotpSecret(first)).toBe(secret);
    expect(decryptTotpSecret(second)).toBe(secret);
  });

  it('throws when the ciphertext has been tampered with', () => {
    const secret = 'JBSWY3DPEHPK3PXP';
    const encrypted = encryptTotpSecret(secret);
    const tamperedBytes = Buffer.from(encrypted, 'base64');
    tamperedBytes[tamperedBytes.length - 1] ^= 0xff;
    const tampered = tamperedBytes.toString('base64');

    expect(() => decryptTotpSecret(tampered)).toThrow();
  });

  it('throws a clear error when TOTP_ENCRYPTION_KEY is not configured', () => {
    delete process.env[ENV.TOTP_ENCRYPTION_KEY];

    expect(() => encryptTotpSecret('JBSWY3DPEHPK3PXP')).toThrow(/TOTP_ENCRYPTION_KEY/);
  });
});
