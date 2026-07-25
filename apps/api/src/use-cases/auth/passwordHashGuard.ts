import { ERROR_CODES } from '@/constants.js';

/**
 * OAuth-only accounts have no passwordHash. bcrypt.compare throws on a null
 * hash, so every password-confirmation call site must check this first.
 */
export function assertHasPassword(passwordHash: string | null): asserts passwordHash is string {
  if (passwordHash === null) {
    throw Object.assign(
      new Error('This account has no password set. Sign in with a linked provider instead.'),
      { code: ERROR_CODES.UNAUTHORIZED },
    );
  }
}
