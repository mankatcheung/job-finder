import type { IApplicationRepository } from '@/use-cases/ports/IApplicationRepository.js';
import type {
  ICreateApplicationUseCase,
  CreateApplicationInput,
  CreateApplicationOutput,
} from '@/use-cases/jobs/ICreateApplicationUseCase.js';

interface Deps {
  applicationRepository: IApplicationRepository;
  generateId: () => string;
}

export class CreateApplicationUseCase implements ICreateApplicationUseCase {
  constructor(private readonly deps: Deps) {}

  async execute(input: CreateApplicationInput): Promise<CreateApplicationOutput> {
    return this.deps.applicationRepository.create({
      id: this.deps.generateId(),
      userId: input.userId,
      company: input.company,
      role: input.role,
      status: input.status ?? 'draft',
      jobUrl: input.jobUrl ?? null,
      location: input.location ?? null,
      salaryRange: input.salaryRange ?? null,
      description: input.description ?? null,
      starred: input.starred ?? false,
      source: input.source ?? null,
      followUpAt: input.followUpAt ?? null,
      tags: input.tags ?? [],
    });
  }
}
