import { NotFoundError } from '#src/use-cases/errors/DomainError.js';
import type { IRestoreApplicationUseCase } from '#src/use-cases/jobs/IRestoreApplicationUseCase.js';
import { assertValidBulkIds } from '#src/use-cases/jobs/bulkValidation.js';
import type {
  IBulkRestoreApplicationsUseCase,
  BulkRestoreApplicationsInput,
  BulkRestoreApplicationsResult,
} from '#src/use-cases/jobs/IBulkRestoreApplicationsUseCase.js';

interface Deps {
  restoreApplicationUseCase: IRestoreApplicationUseCase;
}

/**
 * Restores a selection from Trash in one call, mirroring
 * `BulkDeleteApplicationsUseCase` — same validation, same treatment of an id
 * that is already in the target state.
 *
 * Restore is a single `UPDATE` with no storage work behind it, so unlike
 * emptying Trash there is nothing here worth batching; the value is one round
 * trip from the client instead of one per row.
 */
export class BulkRestoreApplicationsUseCase implements IBulkRestoreApplicationsUseCase {
  constructor(private readonly deps: Deps) {}

  async execute(input: BulkRestoreApplicationsInput): Promise<BulkRestoreApplicationsResult> {
    assertValidBulkIds(input.applicationIds);

    const results = await Promise.allSettled(
      input.applicationIds.map((applicationId) =>
        this.deps.restoreApplicationUseCase.execute({ userId: input.userId, applicationId }),
      ),
    );

    // An id that is no longer in Trash is already where the caller wanted it
    // (a retried batch after a partial success) — an idempotent no-op rather
    // than a failure. Anything else, FORBIDDEN above all, still throws: a
    // silently skipped id belonging to someone else would be a security bug
    // wearing a convenience feature's clothes.
    const realFailure = results.find(
      (r): r is PromiseRejectedResult =>
        r.status === 'rejected' && !(r.reason instanceof NotFoundError),
    );
    if (realFailure) throw realFailure.reason;

    return { restored: results.filter((r) => r.status === 'fulfilled').length };
  }
}
