import type { IApplicationRepository } from '@/use-cases/ports/IApplicationRepository.js';
import type { IGetApplicationUseCase, GetApplicationInput, GetApplicationOutput } from '@/use-cases/jobs/IGetApplicationUseCase.js';

interface Deps {
  applicationRepository: IApplicationRepository;
}

export class GetApplicationUseCase implements IGetApplicationUseCase {
  constructor(private readonly deps: Deps) {}

  async execute(input: GetApplicationInput): Promise<GetApplicationOutput> {
    const app = await this.deps.applicationRepository.findById(input.applicationId);
    if (!app) {
      throw Object.assign(new Error('Application not found'), { code: 'NOT_FOUND' });
    }
    if (app.userId !== input.userId) {
      throw Object.assign(new Error('Forbidden'), { code: 'FORBIDDEN' });
    }
    return app;
  }
}
