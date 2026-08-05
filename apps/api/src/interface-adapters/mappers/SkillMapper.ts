import type { Skill } from '#src/domain/skill/Skill.js';

export interface SkillDTO {
  id: string;
  userId: string;
  name: string;
  category: string | null;
  proficiency: string | null;
  createdAt: string;
}

export class SkillMapper {
  toDTO(entity: Skill): SkillDTO {
    return {
      id: entity.id,
      userId: entity.userId,
      name: entity.name,
      category: entity.category,
      proficiency: entity.proficiency,
      createdAt: entity.createdAt.toISOString(),
    };
  }
}
