import type { ApplicationStatus } from '@/domain/application/ApplicationStatus.js';

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
  createdAt: Date;
  updatedAt: Date;
}
