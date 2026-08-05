import type { Education } from '#src/domain/education/Education.js';

export interface CreateEducationInput {
  userId: string;
  institution: string;
  degree?: string | null;
  field?: string | null;
  startDate: Date;
  endDate?: Date | null;
  description?: string | null;
}
export type CreateEducationOutput = Education;
export interface ICreateEducationUseCase {
  execute(input: CreateEducationInput): Promise<CreateEducationOutput>;
}
