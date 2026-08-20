import type { IApplicationRepository } from '#src/use-cases/ports/IApplicationRepository.js';
import type { ILogger } from '#src/use-cases/ports/ILogger.js';
import type { IPermanentlyDeleteApplicationUseCase } from '#src/use-cases/jobs/IPermanentlyDeleteApplicationUseCase.js';
import type {
  IEmptyTrashUseCase,
  EmptyTrashInput,
  EmptyTrashResult,
} from '#src/use-cases/jobs/IEmptyTrashUseCase.js';

interface Deps {
  applicationRepository: IApplicationRepository;
  permanentlyDeleteApplicationUseCase: IPermanentlyDeleteApplicationUseCase;
  logger: ILogger;
}

/**
 * Destroys everything in one user's Trash, now, without waiting out the
 * retention window.
 *
 * Deliberately the same shape as `PurgeExpiredApplicationsUseCase` — the only
 * differences are which applications it finds and that it answers a request
 * rather than a cron. Both delegate the destroying itself to
 * `PermanentlyDeleteApplicationUseCase`, so there is still exactly one
 * implementation of "destroy an application", and it batches that
 * application's blob deletes into a single storage call.
 *
 * A failure is counted and logged rather than thrown, for the reason the
 * ticket called out: one bad row should not surface as a generic error over a
 * Trash that is now half empty. The caller gets both numbers and can say what
 * actually happened.
 */
export class EmptyTrashUseCase implements IEmptyTrashUseCase {
  constructor(private readonly deps: Deps) {}

  async execute(input: EmptyTrashInput): Promise<EmptyTrashResult> {
    const trashed = await this.deps.applicationRepository.findTrashedByUserId(input.userId);

    let deleted = 0;
    let failed = 0;
    for (const app of trashed) {
      try {
        await this.deps.permanentlyDeleteApplicationUseCase.execute({
          userId: input.userId,
          applicationId: app.id,
        });
        deleted += 1;
      } catch (error) {
        failed += 1;
        this.deps.logger.error(`Failed to empty application ${app.id} from Trash`, error);
      }
    }

    return { deleted, failed };
  }
}
