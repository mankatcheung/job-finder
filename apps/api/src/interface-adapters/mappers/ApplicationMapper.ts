import type { Application } from '@/domain/application/Application.js';
import type { ApplicationStatus } from '@/domain/application/ApplicationStatus.js';

export interface ApplicationDTO {
  id: string;
  userId: string;
  company: string;
  role: string;
  status: ApplicationStatus;
  jobUrl: string | null;
  location: string | null;
  salaryRange: string | null;
  description: string | null;
  appliedAt: string | null;
  starred: boolean;
  source: string | null;
  followUpAt: string | null;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export class ApplicationMapper {
  toDTO(app: Application): ApplicationDTO {
    return {
      id: app.id,
      userId: app.userId,
      company: app.company,
      role: app.role,
      status: app.status,
      jobUrl: app.jobUrl,
      location: app.location,
      salaryRange: app.salaryRange,
      description: app.description,
      appliedAt: app.appliedAt?.toISOString() ?? null,
      starred: app.starred,
      source: app.source,
      followUpAt: app.followUpAt?.toISOString() ?? null,
      tags: app.tags,
      createdAt: app.createdAt.toISOString(),
      updatedAt: app.updatedAt.toISOString(),
    };
  }
}
