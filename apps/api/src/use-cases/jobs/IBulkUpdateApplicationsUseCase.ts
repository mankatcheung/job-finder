import type { Application } from '#src/domain/application/Application.js';
import type { ApplicationStatus } from '#src/domain/application/ApplicationStatus.js';

export interface BulkUpdateApplicationsInput {
  userId: string;
  applicationIds: string[];
  status?: ApplicationStatus;
  starred?: boolean;
}

export type BulkUpdateApplicationsOutput = Application[];

export interface IBulkUpdateApplicationsUseCase {
  execute(input: BulkUpdateApplicationsInput): Promise<BulkUpdateApplicationsOutput>;
}
