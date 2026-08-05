import type { ICreateWorkExperienceUseCase } from '#src/use-cases/workExperience/ICreateWorkExperienceUseCase.js';
import type { IUpdateWorkExperienceUseCase } from '#src/use-cases/workExperience/IUpdateWorkExperienceUseCase.js';
import type { IDeleteWorkExperienceUseCase } from '#src/use-cases/workExperience/IDeleteWorkExperienceUseCase.js';
import type { IWorkExperienceRepository } from '#src/use-cases/ports/IWorkExperienceRepository.js';
import type {
  WorkExperienceMapper,
  WorkExperienceDTO,
} from '#src/interface-adapters/mappers/WorkExperienceMapper.js';

interface Deps {
  createWorkExperienceUseCase: ICreateWorkExperienceUseCase;
  updateWorkExperienceUseCase: IUpdateWorkExperienceUseCase;
  deleteWorkExperienceUseCase: IDeleteWorkExperienceUseCase;
  workExperienceRepository: IWorkExperienceRepository;
  workExperienceMapper: WorkExperienceMapper;
}

interface CreateInput {
  company: string;
  title: string;
  location?: string;
  startDate: string;
  endDate?: string;
  description?: string;
}

interface UpdateInput {
  company?: string;
  title?: string;
  location?: string | null;
  startDate?: string;
  endDate?: string | null;
  description?: string | null;
}

export class WorkExperienceResolver {
  constructor(private readonly deps: Deps) {}

  async getWorkExperiences(userId: string): Promise<WorkExperienceDTO[]> {
    const items = await this.deps.workExperienceRepository.findAllByUserId(userId);
    return items.map((item) => this.deps.workExperienceMapper.toDTO(item));
  }

  async createWorkExperience(userId: string, input: CreateInput): Promise<WorkExperienceDTO> {
    const result = await this.deps.createWorkExperienceUseCase.execute({
      userId,
      company: input.company,
      title: input.title,
      location: input.location,
      startDate: new Date(input.startDate),
      endDate: input.endDate ? new Date(input.endDate) : null,
      description: input.description,
    });
    return this.deps.workExperienceMapper.toDTO(result);
  }

  async updateWorkExperience(
    userId: string,
    id: string,
    input: UpdateInput,
  ): Promise<WorkExperienceDTO> {
    const result = await this.deps.updateWorkExperienceUseCase.execute({
      id,
      userId,
      company: input.company,
      title: input.title,
      location: input.location,
      startDate: input.startDate ? new Date(input.startDate) : undefined,
      endDate: input.endDate === null ? null : input.endDate ? new Date(input.endDate) : undefined,
      description: input.description,
    });
    return this.deps.workExperienceMapper.toDTO(result);
  }

  async deleteWorkExperience(userId: string, id: string): Promise<void> {
    await this.deps.deleteWorkExperienceUseCase.execute({ id, userId });
  }
}
