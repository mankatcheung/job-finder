import type { Application } from '@/domain/application/Application.js';
import type { ApplicationStatus } from '@/domain/application/ApplicationStatus.js';

export interface CreateApplicationInput {
  userId: string;
  company: string;
  role: string;
  status?: ApplicationStatus;
  jobUrl?: string;
  location?: string;
  salaryRange?: string;
  description?: string;
}

export type CreateApplicationOutput = Application;

export interface ICreateApplicationUseCase {
  execute(input: CreateApplicationInput): Promise<CreateApplicationOutput>;
}
