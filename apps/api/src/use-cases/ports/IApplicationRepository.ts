import type { Application } from '#src/domain/application/Application.js';
import type { ApplicationStatus } from '#src/domain/application/ApplicationStatus.js';

export interface ApplicationTagData {
  id: string;
  name: string;
}

export interface CreateApplicationData {
  id: string;
  userId: string;
  company: string;
  role: string;
  status: ApplicationStatus;
  jobUrl?: string | null;
  location?: string | null;
  salaryRange?: string | null;
  description?: string | null;
  starred?: boolean;
  source?: string | null;
  followUpAt?: Date | null;
  tags?: ApplicationTagData[];
}

export interface UpdateApplicationData {
  company?: string;
  role?: string;
  status?: ApplicationStatus;
  jobUrl?: string | null;
  location?: string | null;
  salaryRange?: string | null;
  description?: string | null;
  appliedAt?: Date | null;
  starred?: boolean;
  source?: string | null;
  followUpAt?: Date | null;
  tags?: ApplicationTagData[];
}

export interface FindApplicationsPageFilters {
  status?: ApplicationStatus;
  starred?: boolean;
  search?: string;
}

export interface FindApplicationsPagePagination {
  cursor?: string;
  limit: number;
}

export interface ApplicationsPage {
  items: Application[];
  hasNextPage: boolean;
}

export interface IApplicationRepository {
  findAllByUserId(userId: string, filters?: { status?: ApplicationStatus }): Promise<Application[]>;
  findPageByUserId(
    userId: string,
    filters: FindApplicationsPageFilters,
    pagination: FindApplicationsPagePagination,
  ): Promise<ApplicationsPage>;
  findById(id: string): Promise<Application | null>;
  create(data: CreateApplicationData): Promise<Application>;
  update(id: string, data: UpdateApplicationData): Promise<Application>;
  delete(id: string): Promise<void>;
  findDueForReminder(): Promise<Application[]>;
  updateReminderSentAt(id: string, sentAt: Date): Promise<void>;
}
