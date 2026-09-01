import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { TotpProvider } from '#src/infrastructure/auth/TotpProvider.js';
import { LlmApiKeyCipher } from '#src/infrastructure/llm/LlmApiKeyCipher.js';
import { ENV } from '#src/infrastructure/config/constants.js';

/**
 * Both classes derive their AES key with scryptSync(passphrase, SCRYPT_SALT).
 * The salts still carry the pre-rebrand product name, which reads like an
 * oversight and is not one — renaming either silently changes the key, and
 * everything encrypted under the old one stops decrypting for good.
 *
 * A comment saying so can be skimmed past. These cannot: each pins a
 * ciphertext produced by the current salt, so changing it turns a tidy-up
 * into a failing test instead of a production incident.
 *
 * If a salt ever genuinely needs to change, the fixtures below are regenerated
 * *after* a migration re-encrypts existing data — never before.
 */
describe('scrypt salts are pinned', () => {
  const PASSPHRASE = 'salt-pinning-test-passphrase';
  const original = {
    totp: process.env[ENV.TOTP_ENCRYPTION_KEY],
    llm: process.env[ENV.LLM_API_KEY_ENCRYPTION_KEY],
  };

  beforeAll(() => {
    process.env[ENV.TOTP_ENCRYPTION_KEY] = PASSPHRASE;
    process.env[ENV.LLM_API_KEY_ENCRYPTION_KEY] = PASSPHRASE;
  });

  afterAll(() => {
    for (const [key, value] of [
      [ENV.TOTP_ENCRYPTION_KEY, original.totp],
      [ENV.LLM_API_KEY_ENCRYPTION_KEY, original.llm],
    ] as const) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  });

  it('decrypts a TOTP secret encrypted with the current salt — changing it locks out every user with 2FA', () => {
    const encryptedBefore = 'fVsj57v3RY8Ubm+gsHX7VRSG5aUr4vSOXHpkH+jBz11ghKPdQnS9Llfz5lU=';

    expect(new TotpProvider().decryptSecret(encryptedBefore)).toBe('JBSWY3DPEHPK3PXP');
  });

  it('decrypts an LLM API key encrypted with the current salt — changing it loses every saved key', () => {
    const encryptedBefore = '1e8uZytALIwIO+uow3pnq54S1L3u7xiARD1HzAPrhmag3Z90mE0LWfIhzdvQ7g==';

    expect(new LlmApiKeyCipher().decrypt(encryptedBefore)).toBe('sk-test-0123456789');
  });
});
