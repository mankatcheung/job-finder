import { ERROR_CODES, PASSWORD_MIN_LENGTH } from '@/constants.js';

export function assertValidPassword(password: string): void {
  if (password.length < PASSWORD_MIN_LENGTH) {
    throw Object.assign(new Error(`Password must be at least ${PASSWORD_MIN_LENGTH} characters`), {
      code: ERROR_CODES.VALIDATION,
    });
  }
}
