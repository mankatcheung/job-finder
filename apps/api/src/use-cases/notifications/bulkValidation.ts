import { BULK_ACTIONS, ERROR_CODES } from '#src/constants.js';

/** Shared guard for bulk-write use cases: rejects empty or oversized ID batches. */
export function assertValidBulkNotificationIds(ids: string[]): void {
  if (ids.length === 0) {
    throw Object.assign(new Error('At least one notification id is required'), {
      code: ERROR_CODES.VALIDATION,
    });
  }
  if (ids.length > BULK_ACTIONS.MAX_IDS) {
    throw Object.assign(
      new Error(`Cannot act on more than ${BULK_ACTIONS.MAX_IDS} notifications at once`),
      { code: ERROR_CODES.VALIDATION },
    );
  }
}
