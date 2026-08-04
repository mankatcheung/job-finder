import type { Education } from '#src/domain/education/Education.js';

export interface EducationDTO {
  id: string;
  userId: string;
  institution: string;
  degree: string | null;
  field: string | null;
  startDate: string;
  endDate: string | null;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export class EducationMapper {
  toDTO(entity: Education): EducationDTO {
    return {
      id: entity.id,
      userId: entity.userId,
      institution: entity.institution,
      degree: entity.degree,
      field: entity.field,
      startDate: entity.startDate.toISOString(),
      endDate: entity.endDate?.toISOString() ?? null,
      description: entity.description,
      createdAt: entity.createdAt.toISOString(),
      updatedAt: entity.updatedAt.toISOString(),
    };
  }
}
