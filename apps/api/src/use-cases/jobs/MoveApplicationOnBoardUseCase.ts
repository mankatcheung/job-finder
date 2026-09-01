import {
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from '#src/use-cases/errors/DomainError.js';
import type { IApplicationRepository } from '#src/use-cases/ports/IApplicationRepository.js';
import type { ITransactionManager } from '#src/use-cases/ports/ITransactionManager.js';
import type { IUpdateApplicationUseCase } from '#src/use-cases/jobs/IUpdateApplicationUseCase.js';
import type {
  IMoveApplicationOnBoardUseCase,
  MoveApplicationOnBoardInput,
  MoveApplicationOnBoardOutput,
} from '#src/use-cases/jobs/IMoveApplicationOnBoardUseCase.js';
import { BOARD } from '#src/use-cases/constants.js';

interface Deps {
  applicationRepository: IApplicationRepository;
  updateApplicationUseCase: IUpdateApplicationUseCase;
  transactionManager?: ITransactionManager;
}

/**
 * Places one card in a kanban column: a drag within a column, or a drag into
 * another column, which is a status change and a placement at once.
 *
 * Both halves are one mutation on purpose. Split across two round trips, a
 * cross-column drag would land the card in the right column at whatever depth
 * its old rank happened to point at, then correct itself — visible as a jump.
 */
export class MoveApplicationOnBoardUseCase implements IMoveApplicationOnBoardUseCase {
  constructor(private readonly deps: Deps) {}

  async execute(input: MoveApplicationOnBoardInput): Promise<MoveApplicationOnBoardOutput> {
    const { userId, applicationId, toStatus, orderedIds } = input;

    this.assertValidOrderedIds(orderedIds, applicationId);

    const app = await this.deps.applicationRepository.findById(applicationId);
    if (!app) {
      throw new NotFoundError('Application not found');
    }
    if (app.userId !== userId) {
      throw new ForbiddenError('Forbidden');
    }

    // Every other id must already be a live card of this user's in the
    // destination column. Read outside the transaction, so this goes through
    // the ordinary cached path rather than caching a row nothing has
    // committed yet.
    const owned = await this.deps.applicationRepository.findAllByUserId(userId, {
      status: toStatus,
    });
    const ownedIds = new Set(owned.map((a) => a.id));

    for (const id of orderedIds) {
      if (id === applicationId) continue;
      if (!ownedIds.has(id)) {
        // Someone else's card, one that does not exist, one in another
        // column, and one in the Trash are all the same answer — saying which
        // would confirm the id names something real.
        throw new ForbiddenError('Forbidden');
      }
    }

    const run = async (): Promise<MoveApplicationOnBoardOutput> => {
      // Status first, then the renumber. UpdateApplicationUseCase owns the
      // appliedAt stamp and the status_changed log, and resets boardPosition
      // to 0 — which reorderBoard immediately overwrites with the real index.
      // A move within one column skips this entirely, so a pure reorder
      // writes no activity log: where a card sits is a view preference, not
      // part of the application's history.
      if (app.status !== toStatus) {
        await this.deps.updateApplicationUseCase.execute({
          userId,
          applicationId,
          status: toStatus,
        });
      }

      return this.deps.applicationRepository.reorderBoard(userId, toStatus, orderedIds);
    };

    return this.deps.transactionManager ? this.deps.transactionManager.run(run) : run();
  }

  private assertValidOrderedIds(orderedIds: string[], applicationId: string): void {
    if (orderedIds.length === 0) {
      throw new ValidationError('At least one application id is required');
    }
    if (orderedIds.length > BOARD.MAX_REORDER_IDS) {
      throw new ValidationError(
        `Cannot reorder more than ${BOARD.MAX_REORDER_IDS} applications at once`,
      );
    }
    if (new Set(orderedIds).size !== orderedIds.length) {
      throw new ValidationError('Duplicate application ids');
    }
    if (!orderedIds.includes(applicationId)) {
      throw new ValidationError('orderedIds must contain the moved application');
    }
  }
}
