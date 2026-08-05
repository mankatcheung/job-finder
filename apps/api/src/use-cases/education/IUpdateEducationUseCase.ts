import type { Education } from '#src/domain/education/Education.js';

export interface UpdateEducationInput {
  id: string;
  userId: string;
  institution?: string;
  degree?: string | null;
  field?: string | null;
  startDate?: Date;
  endDate?: Date | null;
  description?: string | null;
}
export type UpdateEducationOutput = Education;
export interface IUpdateEducationUseCase {
  execute(input: UpdateEducationInput): Promise<UpdateEducationOutput>;
}
