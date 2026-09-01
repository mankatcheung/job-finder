import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'crypto';
import type { ILlmApiKeyCipher } from '#src/use-cases/ports/ILlmApiKeyCipher.js';
import { ENV } from '#src/infrastructure/config/constants.js';

const ALGORITHM = 'aes-256-gcm';
const IV_BYTES = 12;
const AUTH_TAG_BYTES = 16;
const KEY_LENGTH = 32;
/**
 * Key-derivation salt, NOT a label — do not rename it.
 *
 * It is an input to scryptSync below, so changing the string changes the
 * derived AES key and every value already encrypted with the old one stops
 * decrypting. The pre-rebrand name is deliberate dead weight: it is load-
 * bearing precisely because it is arbitrary.
 *
 * Renaming it makes every LLM API key users have saved unrecoverable.
 *
 * Rotating it would mean decrypting everything with the old salt and
 * re-encrypting with the new one, in a migration, before any deploy uses it.
 */
const SCRYPT_SALT = 'job-finder-llm-api-key';

export class LlmApiKeyCipher implements ILlmApiKeyCipher {
  private getKey(): Buffer {
    const passphrase = process.env[ENV.LLM_API_KEY_ENCRYPTION_KEY];
    if (!passphrase) {
      throw new Error(
        `${ENV.LLM_API_KEY_ENCRYPTION_KEY} is not configured — required to encrypt/decrypt users' LLM API keys`,
      );
    }
    return scryptSync(passphrase, SCRYPT_SALT, KEY_LENGTH);
  }

  encrypt(plaintext: string): string {
    const iv = randomBytes(IV_BYTES);
    const cipher = createCipheriv(ALGORITHM, this.getKey(), iv);
    const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
    const authTag = cipher.getAuthTag();
    return Buffer.concat([iv, authTag, encrypted]).toString('base64');
  }

  decrypt(ciphertext: string): string {
    const data = Buffer.from(ciphertext, 'base64');
    const iv = data.subarray(0, IV_BYTES);
    const authTag = data.subarray(IV_BYTES, IV_BYTES + AUTH_TAG_BYTES);
    const encrypted = data.subarray(IV_BYTES + AUTH_TAG_BYTES);

    const decipher = createDecipheriv(ALGORITHM, this.getKey(), iv);
    decipher.setAuthTag(authTag);
    const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
    return decrypted.toString('utf8');
  }
}
