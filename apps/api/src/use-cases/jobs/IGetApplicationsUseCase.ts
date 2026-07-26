import type { Application } from '#src/domain/application/Application.js';
import type { ApplicationStatus } from '#src/domain/application/ApplicationStatus.js';

export interface GetApplicationsInput {
  userId: string;
  status?: ApplicationStatus;
}

export type GetApplicationsOutput = Application[];

export interface IGetApplicationsUseCase {
  execute(input: GetApplicationsInput): Promise<GetApplicationsOutput>;
}
