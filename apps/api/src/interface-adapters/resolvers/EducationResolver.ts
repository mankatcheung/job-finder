import type { ICreateEducationUseCase } from '#src/use-cases/education/ICreateEducationUseCase.js';
import type { IUpdateEducationUseCase } from '#src/use-cases/education/IUpdateEducationUseCase.js';
import type { IDeleteEducationUseCase } from '#src/use-cases/education/IDeleteEducationUseCase.js';
import type { IEducationRepository } from '#src/use-cases/ports/IEducationRepository.js';
import type {
  EducationMapper,
  EducationDTO,
} from '#src/interface-adapters/mappers/EducationMapper.js';

interface Deps {
  createEducationUseCase: ICreateEducationUseCase;
  updateEducationUseCase: IUpdateEducationUseCase;
  deleteEducationUseCase: IDeleteEducationUseCase;
  educationRepository: IEducationRepository;
  educationMapper: EducationMapper;
}

interface CreateInput {
  institution: string;
  degree?: string;
  field?: string;
  startDate: string;
  endDate?: string;
  description?: string;
}

interface UpdateInput {
  institution?: string;
  degree?: string | null;
  field?: string | null;
  startDate?: string;
  endDate?: string | null;
  description?: string | null;
}

export class EducationResolver {
  constructor(private readonly deps: Deps) {}

  async getEducations(userId: string): Promise<EducationDTO[]> {
    const items = await this.deps.educationRepository.findAllByUserId(userId);
    return items.map((item) => this.deps.educationMapper.toDTO(item));
  }

  async createEducation(userId: string, input: CreateInput): Promise<EducationDTO> {
    const result = await this.deps.createEducationUseCase.execute({
      userId,
      institution: input.institution,
      degree: input.degree,
      field: input.field,
      startDate: new Date(input.startDate),
      endDate: input.endDate ? new Date(input.endDate) : null,
      description: input.description,
    });
    return this.deps.educationMapper.toDTO(result);
  }

  async updateEducation(userId: string, id: string, input: UpdateInput): Promise<EducationDTO> {
    const result = await this.deps.updateEducationUseCase.execute({
      id,
      userId,
      institution: input.institution,
      degree: input.degree,
      field: input.field,
      startDate: input.startDate ? new Date(input.startDate) : undefined,
      endDate: input.endDate === null ? null : input.endDate ? new Date(input.endDate) : undefined,
      description: input.description,
    });
    return this.deps.educationMapper.toDTO(result);
  }

  async deleteEducation(userId: string, id: string): Promise<void> {
    await this.deps.deleteEducationUseCase.execute({ id, userId });
  }
}
