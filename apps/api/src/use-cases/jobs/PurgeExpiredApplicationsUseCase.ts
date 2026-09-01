import { TRASH } from '#src/use-cases/constants.js';
import type { IApplicationRepository } from '#src/use-cases/ports/IApplicationRepository.js';
import type { ILogger } from '#src/use-cases/ports/ILogger.js';
import type { IPermanentlyDeleteApplicationUseCase } from '#src/use-cases/jobs/IPermanentlyDeleteApplicationUseCase.js';
import type {
  IPurgeExpiredApplicationsUseCase,
  PurgeExpiredApplicationsResult,
} from '#src/use-cases/jobs/IPurgeExpiredApplicationsUseCase.js';

interface Deps {
  applicationRepository: IApplicationRepository;
  permanentlyDeleteApplicationUseCase: IPermanentlyDeleteApplicationUseCase;
  logger: ILogger;
  now: () => Date;
}

/**
 * Finishes what deleting started, for anything that has served its thirty days.
 *
 * Each application is deleted on its own and a failure is logged rather than
 * thrown: one unreachable blob should not strand every later application in
 * Trash for another day, and the next run will pick it up again. The count of
 * failures comes back so the route can report it instead of claiming success.
 */
export class PurgeExpiredApplicationsUseCase implements IPurgeExpiredApplicationsUseCase {
  constructor(private readonly deps: Deps) {}

  async execute(): Promise<PurgeExpiredApplicationsResult> {
    const cutoff = new Date(this.deps.now().getTime() - TRASH.RETENTION_MS);
    const expired = await this.deps.applicationRepository.findDueForPurge(cutoff);

    let purged = 0;
    let failed = 0;
    for (const app of expired) {
      try {
        // The owner's own id, so this goes through the same ownership check as
        // a user pressing "Delete permanently" rather than around it.
        await this.deps.permanentlyDeleteApplicationUseCase.execute({
          userId: app.userId,
          applicationId: app.id,
        });
        purged += 1;
      } catch (error) {
        failed += 1;
        this.deps.logger.error(`Failed to purge application ${app.id}`, error);
      }
    }

    return { purged, failed };
  }
}
