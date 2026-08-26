import type { Skill } from '#src/domain/skill/Skill.js';

export type CreateSkillData = Omit<Skill, 'createdAt'>;
export type UpdateSkillData = Partial<Omit<Skill, 'id' | 'userId' | 'createdAt'>>;

export interface ISkillRepository {
  findAllByUserId(userId: string): Promise<Skill[]>;
  findById(id: string): Promise<Skill | null>;
  create(data: CreateSkillData): Promise<Skill>;
  update(id: string, data: UpdateSkillData): Promise<Skill>;
  delete(id: string, userId: string): Promise<void>;
}
