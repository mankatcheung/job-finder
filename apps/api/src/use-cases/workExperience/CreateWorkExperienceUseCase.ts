import type { IWorkExperienceRepository } from '#src/use-cases/ports/IWorkExperienceRepository.js';
import type {
  ICreateWorkExperienceUseCase,
  CreateWorkExperienceInput,
  CreateWorkExperienceOutput,
} from '#src/use-cases/workExperience/ICreateWorkExperienceUseCase.js';

interface Deps {
  workExperienceRepository: IWorkExperienceRepository;
  generateId: () => string;
}

export class CreateWorkExperienceUseCase implements ICreateWorkExperienceUseCase {
  constructor(private readonly deps: Deps) {}

  async execute(input: CreateWorkExperienceInput): Promise<CreateWorkExperienceOutput> {
    return this.deps.workExperienceRepository.create({
      id: this.deps.generateId(),
      userId: input.userId,
      company: input.company,
      title: input.title,
      location: input.location ?? null,
      startDate: input.startDate,
      endDate: input.endDate ?? null,
      description: input.description ?? null,
    });
  }
}
