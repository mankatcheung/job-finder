import { NotFoundError } from '#src/use-cases/errors/DomainError.js';
import type { ISkillRepository } from '#src/use-cases/ports/ISkillRepository.js';
import type {
  IUpdateSkillUseCase,
  UpdateSkillInput,
  UpdateSkillOutput,
} from '#src/use-cases/skill/IUpdateSkillUseCase.js';

interface Deps {
  skillRepository: ISkillRepository;
}

export class UpdateSkillUseCase implements IUpdateSkillUseCase {
  constructor(private readonly deps: Deps) {}

  async execute(input: UpdateSkillInput): Promise<UpdateSkillOutput> {
    const existing = await this.deps.skillRepository.findById(input.id);
    if (!existing || existing.userId !== input.userId) {
      throw new NotFoundError('Skill not found');
    }
    return this.deps.skillRepository.update(input.id, {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.category !== undefined ? { category: input.category } : {}),
      ...(input.proficiency !== undefined ? { proficiency: input.proficiency } : {}),
    });
  }
}
