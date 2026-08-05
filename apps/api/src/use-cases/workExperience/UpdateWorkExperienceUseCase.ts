import type { IWorkExperienceRepository } from '#src/use-cases/ports/IWorkExperienceRepository.js';
import type {
  IUpdateWorkExperienceUseCase,
  UpdateWorkExperienceInput,
  UpdateWorkExperienceOutput,
} from '#src/use-cases/workExperience/IUpdateWorkExperienceUseCase.js';

interface Deps {
  workExperienceRepository: IWorkExperienceRepository;
}

export class UpdateWorkExperienceUseCase implements IUpdateWorkExperienceUseCase {
  constructor(private readonly deps: Deps) {}

  async execute(input: UpdateWorkExperienceInput): Promise<UpdateWorkExperienceOutput> {
    const existing = await this.deps.workExperienceRepository.findById(input.id);
    if (!existing || existing.userId !== input.userId) {
      throw new Error('Work experience not found');
    }
    return this.deps.workExperienceRepository.update(input.id, {
      ...(input.company !== undefined ? { company: input.company } : {}),
      ...(input.title !== undefined ? { title: input.title } : {}),
      ...(input.location !== undefined ? { location: input.location } : {}),
      ...(input.startDate !== undefined ? { startDate: input.startDate } : {}),
      ...(input.endDate !== undefined ? { endDate: input.endDate } : {}),
      ...(input.description !== undefined ? { description: input.description } : {}),
    });
  }
}
