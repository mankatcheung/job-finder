import type { Application } from '#src/domain/application/Application.js';
import type { ApplicationStatus } from '#src/domain/application/ApplicationStatus.js';

export interface GetApplicationsPageInput {
  userId: string;
  status?: ApplicationStatus;
  starred?: boolean;
  search?: string;
  likelyGhosted?: boolean;
  cursor?: string;
  limit?: number;
}

export interface GetApplicationsPageOutput {
  items: Application[];
  nextCursor: string | null;
  hasNextPage: boolean;
}

export interface IGetApplicationsPageUseCase {
  execute(input: GetApplicationsPageInput): Promise<GetApplicationsPageOutput>;
}
