import { NotFoundError } from '#src/use-cases/errors/DomainError.js';
import type { ISkillRepository } from '#src/use-cases/ports/ISkillRepository.js';
import type {
  IDeleteSkillUseCase,
  DeleteSkillInput,
} from '#src/use-cases/skill/IDeleteSkillUseCase.js';

interface Deps {
  skillRepository: ISkillRepository;
}

export class DeleteSkillUseCase implements IDeleteSkillUseCase {
  constructor(private readonly deps: Deps) {}

  async execute(input: DeleteSkillInput): Promise<void> {
    const existing = await this.deps.skillRepository.findById(input.id);
    if (!existing || existing.userId !== input.userId) {
      throw new NotFoundError('Skill not found');
    }
    await this.deps.skillRepository.delete(input.id, existing.userId);
  }
}
