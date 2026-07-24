import type { Application } from '@/domain/application/Application.js';
import type { ApplicationStatus } from '@/domain/application/ApplicationStatus.js';

export interface GetApplicationsPageInput {
  userId: string;
  status?: ApplicationStatus;
  starred?: boolean;
  search?: string;
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
