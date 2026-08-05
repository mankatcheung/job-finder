import type { ISkillRepository } from '#src/use-cases/ports/ISkillRepository.js';
import type {
  ICreateSkillUseCase,
  CreateSkillInput,
  CreateSkillOutput,
} from '#src/use-cases/skill/ICreateSkillUseCase.js';

interface Deps {
  skillRepository: ISkillRepository;
  generateId: () => string;
}

export class CreateSkillUseCase implements ICreateSkillUseCase {
  constructor(private readonly deps: Deps) {}

  async execute(input: CreateSkillInput): Promise<CreateSkillOutput> {
    return this.deps.skillRepository.create({
      id: this.deps.generateId(),
      userId: input.userId,
      name: input.name,
      category: input.category ?? null,
      proficiency: input.proficiency ?? null,
    });
  }
}
