import { NotFoundError } from '#src/use-cases/errors/DomainError.js';
import type { IEducationRepository } from '#src/use-cases/ports/IEducationRepository.js';
import type {
  IDeleteEducationUseCase,
  DeleteEducationInput,
} from '#src/use-cases/education/IDeleteEducationUseCase.js';

interface Deps {
  educationRepository: IEducationRepository;
}

export class DeleteEducationUseCase implements IDeleteEducationUseCase {
  constructor(private readonly deps: Deps) {}

  async execute(input: DeleteEducationInput): Promise<void> {
    const existing = await this.deps.educationRepository.findById(input.id);
    if (!existing || existing.userId !== input.userId) {
      throw new NotFoundError('Education not found');
    }
    await this.deps.educationRepository.delete(input.id, existing.userId);
  }
}
