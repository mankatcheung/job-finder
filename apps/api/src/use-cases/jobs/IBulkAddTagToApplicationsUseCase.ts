import type { Application } from '#src/domain/application/Application.js';

export interface BulkAddTagToApplicationsInput {
  userId: string;
  applicationIds: string[];
  tag: string;
}

export type BulkAddTagToApplicationsOutput = Application[];

export interface IBulkAddTagToApplicationsUseCase {
  execute(input: BulkAddTagToApplicationsInput): Promise<BulkAddTagToApplicationsOutput>;
}
