import type { WorkExperience } from '#src/domain/workExperience/WorkExperience.js';

export type CreateWorkExperienceData = Omit<WorkExperience, 'createdAt' | 'updatedAt'>;
export type UpdateWorkExperienceData = Partial<
  Omit<WorkExperience, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
>;

export interface IWorkExperienceRepository {
  findAllByUserId(userId: string): Promise<WorkExperience[]>;
  findById(id: string): Promise<WorkExperience | null>;
  create(data: CreateWorkExperienceData): Promise<WorkExperience>;
  update(id: string, data: UpdateWorkExperienceData): Promise<WorkExperience>;
  delete(id: string): Promise<void>;
}
