import { NotFoundError } from '#src/use-cases/errors/DomainError.js';
import type { IEducationRepository } from '#src/use-cases/ports/IEducationRepository.js';
import type {
  IUpdateEducationUseCase,
  UpdateEducationInput,
  UpdateEducationOutput,
} from '#src/use-cases/education/IUpdateEducationUseCase.js';

interface Deps {
  educationRepository: IEducationRepository;
}

export class UpdateEducationUseCase implements IUpdateEducationUseCase {
  constructor(private readonly deps: Deps) {}

  async execute(input: UpdateEducationInput): Promise<UpdateEducationOutput> {
    const existing = await this.deps.educationRepository.findById(input.id);
    if (!existing || existing.userId !== input.userId) {
      throw new NotFoundError('Education not found');
    }
    return this.deps.educationRepository.update(input.id, {
      ...(input.institution !== undefined ? { institution: input.institution } : {}),
      ...(input.degree !== undefined ? { degree: input.degree } : {}),
      ...(input.field !== undefined ? { field: input.field } : {}),
      ...(input.startDate !== undefined ? { startDate: input.startDate } : {}),
      ...(input.endDate !== undefined ? { endDate: input.endDate } : {}),
      ...(input.description !== undefined ? { description: input.description } : {}),
    });
  }
}
