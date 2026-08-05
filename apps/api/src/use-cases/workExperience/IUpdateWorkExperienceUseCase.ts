import type { WorkExperience } from '#src/domain/workExperience/WorkExperience.js';

export interface UpdateWorkExperienceInput {
  id: string;
  userId: string;
  company?: string;
  title?: string;
  location?: string | null;
  startDate?: Date;
  endDate?: Date | null;
  description?: string | null;
}
export type UpdateWorkExperienceOutput = WorkExperience;
export interface IUpdateWorkExperienceUseCase {
  execute(input: UpdateWorkExperienceInput): Promise<UpdateWorkExperienceOutput>;
}
