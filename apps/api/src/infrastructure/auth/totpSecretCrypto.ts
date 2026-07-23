import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'crypto';
import { ENV } from '@/constants.js';

const ALGORITHM = 'aes-256-gcm';
const IV_BYTES = 12;
const KEY_LENGTH = 32;
const SCRYPT_SALT = 'job-finder-totp-secret';

function getKey(): Buffer {
  const passphrase = process.env[ENV.TOTP_ENCRYPTION_KEY];
  if (!passphrase) {
    throw new Error(
      `${ENV.TOTP_ENCRYPTION_KEY} is not configured — required to encrypt/decrypt TOTP secrets`,
    );
  }
  return scryptSync(passphrase, SCRYPT_SALT, KEY_LENGTH);
}

/** Encrypts a raw base32 TOTP secret for storage at rest. */
export function encryptTotpSecret(plaintext: string): string {
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv(ALGORITHM, getKey(), iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return Buffer.concat([iv, authTag, encrypted]).toString('base64');
}

/** Decrypts a TOTP secret previously produced by {@link encryptTotpSecret}. */
export function decryptTotpSecret(ciphertext: string): string {
  const data = Buffer.from(ciphertext, 'base64');
  const iv = data.subarray(0, IV_BYTES);
  const authTag = data.subarray(IV_BYTES, IV_BYTES + 16);
  const encrypted = data.subarray(IV_BYTES + 16);

  const decipher = createDecipheriv(ALGORITHM, getKey(), iv);
  decipher.setAuthTag(authTag);
  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
  return decrypted.toString('utf8');
}
