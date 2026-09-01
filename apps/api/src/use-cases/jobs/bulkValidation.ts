import { ValidationError } from '#src/use-cases/errors/DomainError.js';
import { BULK_ACTIONS } from '#src/use-cases/constants.js';

/** Shared guard for bulk-write use cases: rejects empty or oversized ID batches. */
export function assertValidBulkIds(ids: string[]): void {
  if (ids.length === 0) {
    throw new ValidationError('At least one application id is required');
  }
  if (ids.length > BULK_ACTIONS.MAX_IDS) {
    throw new ValidationError(
      `Cannot act on more than ${BULK_ACTIONS.MAX_IDS} applications at once`,
    );
  }
}
