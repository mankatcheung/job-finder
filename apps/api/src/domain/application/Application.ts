import type { ApplicationStatus } from '#src/domain/application/ApplicationStatus.js';

export interface Application {
  id: string;
  userId: string;
  company: string;
  role: string;
  status: ApplicationStatus;
  jobUrl: string | null;
  location: string | null;
  salaryRange: string | null;
  description: string | null;
  appliedAt: Date | null;
  starred: boolean;
  source: string | null;
  followUpAt: Date | null;
  tags: string[];
  reminderSentAt: Date | null;
  /** In Trash since; null for a live application. */
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
