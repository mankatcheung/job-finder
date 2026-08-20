import { UnauthorizedError } from '#src/use-cases/errors/DomainError.js';

/**
 * OAuth-only accounts have no passwordHash. bcrypt.compare throws on a null
 * hash, so every password-confirmation call site must check this first.
 */
export function assertHasPassword(passwordHash: string | null): asserts passwordHash is string {
  if (passwordHash === null) {
    throw new UnauthorizedError(
      'This account has no password set. Sign in with a linked provider instead.',
    );
  }
}
