import type { ICreateSkillUseCase } from '#src/use-cases/skill/ICreateSkillUseCase.js';
import type { IUpdateSkillUseCase } from '#src/use-cases/skill/IUpdateSkillUseCase.js';
import type { IDeleteSkillUseCase } from '#src/use-cases/skill/IDeleteSkillUseCase.js';
import type { ISkillRepository } from '#src/use-cases/ports/ISkillRepository.js';
import type { SkillMapper, SkillDTO } from '#src/interface-adapters/mappers/SkillMapper.js';

interface Deps {
  createSkillUseCase: ICreateSkillUseCase;
  updateSkillUseCase: IUpdateSkillUseCase;
  deleteSkillUseCase: IDeleteSkillUseCase;
  skillRepository: ISkillRepository;
  skillMapper: SkillMapper;
}

interface CreateInput {
  name: string;
  category?: string;
  proficiency?: string;
}

interface UpdateInput {
  name?: string;
  category?: string | null;
  proficiency?: string | null;
}

export class SkillResolver {
  constructor(private readonly deps: Deps) {}

  async getSkills(userId: string): Promise<SkillDTO[]> {
    const items = await this.deps.skillRepository.findAllByUserId(userId);
    return items.map((item) => this.deps.skillMapper.toDTO(item));
  }

  async createSkill(userId: string, input: CreateInput): Promise<SkillDTO> {
    const result = await this.deps.createSkillUseCase.execute({
      userId,
      name: input.name,
      category: input.category,
      proficiency: input.proficiency,
    });
    return this.deps.skillMapper.toDTO(result);
  }

  async updateSkill(userId: string, id: string, input: UpdateInput): Promise<SkillDTO> {
    const result = await this.deps.updateSkillUseCase.execute({
      id,
      userId,
      name: input.name,
      category: input.category,
      proficiency: input.proficiency,
    });
    return this.deps.skillMapper.toDTO(result);
  }

  async deleteSkill(userId: string, id: string): Promise<void> {
    await this.deps.deleteSkillUseCase.execute({ id, userId });
  }
}
