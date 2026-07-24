export interface ITotpProvider {
  /** Generates a new random base32 TOTP secret. */
  generateSecret(): string;
  /** Builds the `otpauth://` URI (for QR-code display) for a secret/account label. */
  getOtpauthUrl(secret: string, label: string): string;
  /** Verifies a 6-digit code against a secret, allowing a small clock-drift window. */
  verifyCode(secret: string, code: string): Promise<boolean>;
  /** Encrypts a raw secret for storage at rest. */
  encryptSecret(secret: string): string;
  /** Decrypts a secret previously produced by {@link encryptSecret}. */
  decryptSecret(encryptedSecret: string): string;
}
