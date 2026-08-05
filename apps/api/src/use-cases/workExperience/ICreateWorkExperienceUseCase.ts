import type { WorkExperience } from '#src/domain/workExperience/WorkExperience.js';

export interface CreateWorkExperienceInput {
  userId: string;
  company: string;
  title: string;
  location?: string | null;
  startDate: Date;
  endDate?: Date | null;
  description?: string | null;
}
export type CreateWorkExperienceOutput = WorkExperience;
export interface ICreateWorkExperienceUseCase {
  execute(input: CreateWorkExperienceInput): Promise<CreateWorkExperienceOutput>;
}
