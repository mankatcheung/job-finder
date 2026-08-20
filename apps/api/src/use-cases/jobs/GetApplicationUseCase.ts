import { ForbiddenError, NotFoundError } from '#src/use-cases/errors/DomainError.js';
import type { IApplicationRepository } from '#src/use-cases/ports/IApplicationRepository.js';
import type {
  IGetApplicationUseCase,
  GetApplicationInput,
  GetApplicationOutput,
} from '#src/use-cases/jobs/IGetApplicationUseCase.js';

interface Deps {
  applicationRepository: IApplicationRepository;
}

export class GetApplicationUseCase implements IGetApplicationUseCase {
  constructor(private readonly deps: Deps) {}

  async execute(input: GetApplicationInput): Promise<GetApplicationOutput> {
    const app = input.includeTrashed
      ? await this.deps.applicationRepository.findByIdIncludingTrashed(input.applicationId)
      : await this.deps.applicationRepository.findById(input.applicationId);
    if (!app) {
      throw new NotFoundError('Application not found');
    }
    if (app.userId !== input.userId) {
      throw new ForbiddenError('Forbidden');
    }
    return app;
  }
}
