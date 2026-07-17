import type { Application } from '@/domain/application/Application.js';
import type { ApplicationStatus } from '@/domain/application/ApplicationStatus.js';

export interface GetApplicationsInput {
  userId: string;
  status?: ApplicationStatus;
}

export type GetApplicationsOutput = Application[];

export interface IGetApplicationsUseCase {
  execute(input: GetApplicationsInput): Promise<GetApplicationsOutput>;
}
