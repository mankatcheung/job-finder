import type { Application } from '@/domain/application/Application.js';
import type { ApplicationStatus } from '@/domain/application/ApplicationStatus.js';

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
  tags?: string[];
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
  tags?: string[];
}

export interface IApplicationRepository {
  findAllByUserId(userId: string, filters?: { status?: ApplicationStatus }): Promise<Application[]>;
  findById(id: string): Promise<Application | null>;
  create(data: CreateApplicationData): Promise<Application>;
  update(id: string, data: UpdateApplicationData): Promise<Application>;
  delete(id: string): Promise<void>;
  findDueForReminder(): Promise<Application[]>;
  updateReminderSentAt(id: string, sentAt: Date): Promise<void>;
}
