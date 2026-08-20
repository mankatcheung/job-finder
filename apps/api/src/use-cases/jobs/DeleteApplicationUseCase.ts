import { ForbiddenError, NotFoundError } from '#src/use-cases/errors/DomainError.js';
import type { IApplicationRepository } from '#src/use-cases/ports/IApplicationRepository.js';
import type {
  IDeleteApplicationUseCase,
  DeleteApplicationInput,
} from '#src/use-cases/jobs/IDeleteApplicationUseCase.js';

interface Deps {
  applicationRepository: IApplicationRepository;
  now: () => Date;
}

/**
 * Moves an application to Trash. It stops being visible everywhere at once —
 * lists, search, analytics, the reminder and digest jobs, the MCP tools —
 * because the repository filters it out rather than each caller remembering to.
 *
 * Nothing is destroyed here. The documents keep their blobs and the eight
 * child tables keep their rows, which is what lets restore be a single UPDATE.
 * PurgeExpiredApplicationsUseCase does the destroying, thirty days later.
 */
export class DeleteApplicationUseCase implements IDeleteApplicationUseCase {
  constructor(private readonly deps: Deps) {}

  async execute(input: DeleteApplicationInput): Promise<void> {
    const app = await this.deps.applicationRepository.findById(input.applicationId);
    if (!app) throw new NotFoundError('Application not found');
    if (app.userId !== input.userId) throw new ForbiddenError('Forbidden');

    await this.deps.applicationRepository.softDelete(input.applicationId, this.deps.now());
  }
}
