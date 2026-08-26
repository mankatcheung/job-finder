import { NotFoundError } from '#src/use-cases/errors/DomainError.js';
import type { IWorkExperienceRepository } from '#src/use-cases/ports/IWorkExperienceRepository.js';
import type {
  IDeleteWorkExperienceUseCase,
  DeleteWorkExperienceInput,
} from '#src/use-cases/workExperience/IDeleteWorkExperienceUseCase.js';

interface Deps {
  workExperienceRepository: IWorkExperienceRepository;
}

export class DeleteWorkExperienceUseCase implements IDeleteWorkExperienceUseCase {
  constructor(private readonly deps: Deps) {}

  async execute(input: DeleteWorkExperienceInput): Promise<void> {
    const existing = await this.deps.workExperienceRepository.findById(input.id);
    if (!existing || existing.userId !== input.userId) {
      throw new NotFoundError('Work experience not found');
    }
    await this.deps.workExperienceRepository.delete(input.id, existing.userId);
  }
}
