import type { IDeleteApplicationUseCase } from '@/use-cases/jobs/IDeleteApplicationUseCase.js';
import { assertValidBulkIds } from '@/use-cases/jobs/bulkValidation.js';
import { ERROR_CODES } from '@/constants.js';
import type {
  IBulkDeleteApplicationsUseCase,
  BulkDeleteApplicationsInput,
} from '@/use-cases/jobs/IBulkDeleteApplicationsUseCase.js';

interface Deps {
  deleteApplicationUseCase: IDeleteApplicationUseCase;
}

export class BulkDeleteApplicationsUseCase implements IBulkDeleteApplicationsUseCase {
  constructor(private readonly deps: Deps) {}

  async execute(input: BulkDeleteApplicationsInput): Promise<void> {
    assertValidBulkIds(input.applicationIds);

    const results = await Promise.allSettled(
      input.applicationIds.map((applicationId) =>
        this.deps.deleteApplicationUseCase.execute({ userId: input.userId, applicationId }),
      ),
    );

    // A NOT_FOUND item is already gone (e.g. a retried bulk-delete after a
    // partial success) — treat it as an idempotent no-op, not a failure.
    const realFailure = results.find(
      (r): r is PromiseRejectedResult =>
        r.status === 'rejected' && (r.reason as { code?: string })?.code !== ERROR_CODES.NOT_FOUND,
    );

    if (realFailure) {
      throw realFailure.reason;
    }
  }
}
