import type { IApplicationRepository } from '#src/use-cases/ports/IApplicationRepository.js';
import { DEFAULTS } from '#src/use-cases/constants.js';
import type {
  ICreateApplicationUseCase,
  CreateApplicationInput,
  CreateApplicationOutput,
} from '#src/use-cases/jobs/ICreateApplicationUseCase.js';

interface Deps {
  applicationRepository: IApplicationRepository;
  generateId: () => string;
}

export class CreateApplicationUseCase implements ICreateApplicationUseCase {
  constructor(private readonly deps: Deps) {}

  async execute(input: CreateApplicationInput): Promise<CreateApplicationOutput> {
    const tags = (input.tags ?? []).map((name) => ({ id: this.deps.generateId(), name }));

    return this.deps.applicationRepository.create({
      id: this.deps.generateId(),
      userId: input.userId,
      company: input.company,
      role: input.role,
      status: input.status ?? DEFAULTS.APPLICATION_STATUS,
      jobUrl: input.jobUrl ?? null,
      location: input.location ?? null,
      salaryRange: input.salaryRange ?? null,
      description: input.description ?? null,
      starred: input.starred ?? false,
      source: input.source ?? null,
      followUpAt: input.followUpAt ?? null,
      tags,
    });
  }
}
