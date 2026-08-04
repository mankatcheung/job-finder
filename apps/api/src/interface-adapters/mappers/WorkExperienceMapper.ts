import type { WorkExperience } from '#src/domain/workExperience/WorkExperience.js';

export interface WorkExperienceDTO {
  id: string;
  userId: string;
  company: string;
  title: string;
  location: string | null;
  startDate: string;
  endDate: string | null;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export class WorkExperienceMapper {
  toDTO(entity: WorkExperience): WorkExperienceDTO {
    return {
      id: entity.id,
      userId: entity.userId,
      company: entity.company,
      title: entity.title,
      location: entity.location,
      startDate: entity.startDate.toISOString(),
      endDate: entity.endDate?.toISOString() ?? null,
      description: entity.description,
      createdAt: entity.createdAt.toISOString(),
      updatedAt: entity.updatedAt.toISOString(),
    };
  }
}
