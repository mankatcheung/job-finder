import type { Skill } from '#src/domain/skill/Skill.js';

export interface CreateSkillInput {
  userId: string;
  name: string;
  category?: string | null;
  proficiency?: string | null;
}
export type CreateSkillOutput = Skill;
export interface ICreateSkillUseCase {
  execute(input: CreateSkillInput): Promise<CreateSkillOutput>;
}
