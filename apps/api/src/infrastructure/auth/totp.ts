import { TOTP, NobleCryptoPlugin, ScureBase32Plugin } from 'otplib';
import { TOTP_CONFIG } from '@/constants.js';

const crypto = new NobleCryptoPlugin();
const base32 = new ScureBase32Plugin();

/** Shared TOTP instance factory — `secret`/`label` are supplied per call site. */
export function createTotp(options: { secret?: string; label?: string } = {}): TOTP {
  return new TOTP({ crypto, base32, issuer: TOTP_CONFIG.ISSUER, ...options });
}
