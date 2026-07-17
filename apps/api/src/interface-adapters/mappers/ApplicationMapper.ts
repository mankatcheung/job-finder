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
      createdAt: app.createdAt.toISOString(),
      updatedAt: app.updatedAt.toISOString(),
    };
  }
}
