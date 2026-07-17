import type { ApplicationStatus } from '@/domain/application/ApplicationStatus.js';
import type { ICreateApplicationUseCase } from '@/use-cases/jobs/ICreateApplicationUseCase.js';
import type { IGetApplicationsUseCase } from '@/use-cases/jobs/IGetApplicationsUseCase.js';
import type { IGetApplicationUseCase } from '@/use-cases/jobs/IGetApplicationUseCase.js';
import type { IUpdateApplicationUseCase } from '@/use-cases/jobs/IUpdateApplicationUseCase.js';
import type { IDeleteApplicationUseCase } from '@/use-cases/jobs/IDeleteApplicationUseCase.js';
import type { ApplicationMapper, ApplicationDTO } from '@/interface-adapters/mappers/ApplicationMapper.js';

interface Deps {
  createApplicationUseCase: ICreateApplicationUseCase;
  getApplicationsUseCase: IGetApplicationsUseCase;
  getApplicationUseCase: IGetApplicationUseCase;
  updateApplicationUseCase: IUpdateApplicationUseCase;
  deleteApplicationUseCase: IDeleteApplicationUseCase;
  applicationMapper: ApplicationMapper;
}

interface CreateInput {
  company: string;
  role: string;
  status?: ApplicationStatus;
  jobUrl?: string;
  location?: string;
  salaryRange?: string;
  description?: string;
}

interface UpdateInput {
  company?: string;
  role?: string;
  status?: ApplicationStatus;
  jobUrl?: string | null;
  location?: string | null;
  salaryRange?: string | null;
  description?: string | null;
}

export class ApplicationResolver {
  constructor(private readonly deps: Deps) {}

  async getApplications(userId: string, status?: ApplicationStatus): Promise<ApplicationDTO[]> {
    const apps = await this.deps.getApplicationsUseCase.execute({ userId, status });
    return apps.map((a) => this.deps.applicationMapper.toDTO(a));
  }

  async getApplication(userId: string, id: string): Promise<ApplicationDTO> {
    const app = await this.deps.getApplicationUseCase.execute({ userId, applicationId: id });
    return this.deps.applicationMapper.toDTO(app);
  }

  async createApplication(userId: string, input: CreateInput): Promise<ApplicationDTO> {
    const app = await this.deps.createApplicationUseCase.execute({ userId, ...input });
    return this.deps.applicationMapper.toDTO(app);
  }

  async updateApplication(userId: string, id: string, input: UpdateInput): Promise<ApplicationDTO> {
    const app = await this.deps.updateApplicationUseCase.execute({
      userId,
      applicationId: id,
      ...input,
    });
    return this.deps.applicationMapper.toDTO(app);
  }

  async deleteApplication(userId: string, id: string): Promise<boolean> {
    await this.deps.deleteApplicationUseCase.execute({ userId, applicationId: id });
    return true;
  }
}
