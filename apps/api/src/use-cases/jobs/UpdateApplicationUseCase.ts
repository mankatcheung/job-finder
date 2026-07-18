import type { IApplicationRepository } from '@/use-cases/ports/IApplicationRepository.js';
import type { IUpdateApplicationUseCase, UpdateApplicationInput, UpdateApplicationOutput } from '@/use-cases/jobs/IUpdateApplicationUseCase.js';

interface Deps {
  applicationRepository: IApplicationRepository;
}

export class UpdateApplicationUseCase implements IUpdateApplicationUseCase {
  constructor(private readonly deps: Deps) {}

  async execute(input: UpdateApplicationInput): Promise<UpdateApplicationOutput> {
    const app = await this.deps.applicationRepository.findById(input.applicationId);
    if (!app) {
      throw Object.assign(new Error('Application not found'), { code: 'NOT_FOUND' });
    }
    if (app.userId !== input.userId) {
      throw Object.assign(new Error('Forbidden'), { code: 'FORBIDDEN' });
    }

    const appliedAt = input.status === 'applied' && app.appliedAt === null ? new Date() : undefined;

    return this.deps.applicationRepository.update(input.applicationId, {
      company: input.company,
      role: input.role,
      status: input.status,
      jobUrl: input.jobUrl,
      location: input.location,
      salaryRange: input.salaryRange,
      description: input.description,
      starred: input.starred,
      source: input.source,
      followUpAt: input.followUpAt,
      ...(appliedAt !== undefined ? { appliedAt } : {}),
    });
  }
}
