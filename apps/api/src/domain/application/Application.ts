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
  createdAt: Date;
  updatedAt: Date;
}
