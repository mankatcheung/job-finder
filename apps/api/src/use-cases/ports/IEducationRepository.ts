import type { Education } from '#src/domain/education/Education.js';

export type CreateEducationData = Omit<Education, 'createdAt' | 'updatedAt'>;
export type UpdateEducationData = Partial<
  Omit<Education, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
>;

export interface IEducationRepository {
  findAllByUserId(userId: string): Promise<Education[]>;
  findById(id: string): Promise<Education | null>;
  create(data: CreateEducationData): Promise<Education>;
  update(id: string, data: UpdateEducationData): Promise<Education>;
  delete(id: string, userId: string): Promise<void>;
}
