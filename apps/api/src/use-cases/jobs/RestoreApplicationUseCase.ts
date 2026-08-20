import { ForbiddenError, NotFoundError } from '#src/use-cases/errors/DomainError.js';
import type { IApplicationRepository } from '#src/use-cases/ports/IApplicationRepository.js';
import type {
  IRestoreApplicationUseCase,
  RestoreApplicationInput,
} from '#src/use-cases/jobs/IRestoreApplicationUseCase.js';

interface Deps {
  applicationRepository: IApplicationRepository;
}

/**
 * Brings an application back out of Trash.
 *
 * Looks it up including trashed ones — `findById` would report it missing,
 * which is the point of that filter everywhere else and exactly wrong here.
 */
export class RestoreApplicationUseCase implements IRestoreApplicationUseCase {
  constructor(private readonly deps: Deps) {}

  async execute(input: RestoreApplicationInput): Promise<void> {
    const app = await this.deps.applicationRepository.findByIdIncludingTrashed(input.applicationId);
    if (!app || !app.deletedAt) throw new NotFoundError('Application not found in Trash');
    if (app.userId !== input.userId) throw new ForbiddenError('Forbidden');

    await this.deps.applicationRepository.restore(input.applicationId);
  }
}
