import type { IApplicationRepository } from '#src/use-cases/ports/IApplicationRepository.js';
import { ERROR_CODES } from '#src/constants.js';
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
    const app = await this.deps.applicationRepository.findById(input.applicationId);
    if (!app) {
      throw Object.assign(new Error('Application not found'), { code: ERROR_CODES.NOT_FOUND });
    }
    if (app.userId !== input.userId) {
      throw Object.assign(new Error('Forbidden'), { code: ERROR_CODES.FORBIDDEN });
    }
    return app;
  }
}
