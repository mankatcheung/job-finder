import type { Application } from '@/domain/application/Application.js';
import type { ApplicationStatus } from '@/domain/application/ApplicationStatus.js';

export interface UpdateApplicationInput {
  userId: string;
  applicationId: string;
  company?: string;
  role?: string;
  status?: ApplicationStatus;
  jobUrl?: string | null;
  location?: string | null;
  salaryRange?: string | null;
  description?: string | null;
  starred?: boolean;
  source?: string | null;
  followUpAt?: Date | null;
  tags?: string[];
}

export type UpdateApplicationOutput = Application;

export interface IUpdateApplicationUseCase {
  execute(input: UpdateApplicationInput): Promise<UpdateApplicationOutput>;
}
