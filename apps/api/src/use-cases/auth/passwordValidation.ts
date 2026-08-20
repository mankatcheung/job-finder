import { ValidationError } from '#src/use-cases/errors/DomainError.js';
import { PASSWORD_MIN_LENGTH } from '#src/constants.js';

export function assertValidPassword(password: string): void {
  if (password.length < PASSWORD_MIN_LENGTH) {
    throw new ValidationError(`Password must be at least ${PASSWORD_MIN_LENGTH} characters`);
  }
}
