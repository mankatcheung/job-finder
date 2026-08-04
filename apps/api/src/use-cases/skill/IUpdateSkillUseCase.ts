import type { Skill } from '#src/domain/skill/Skill.js';

export interface UpdateSkillInput {
  id: string;
  userId: string;
  name?: string;
  category?: string | null;
  proficiency?: string | null;
}
export type UpdateSkillOutput = Skill;
export interface IUpdateSkillUseCase {
  execute(input: UpdateSkillInput): Promise<UpdateSkillOutput>;
}
