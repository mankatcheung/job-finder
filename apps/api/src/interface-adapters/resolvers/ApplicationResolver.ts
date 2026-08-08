import type { ApplicationStatus } from '#src/domain/application/ApplicationStatus.js';
import type { ICreateApplicationUseCase } from '#src/use-cases/jobs/ICreateApplicationUseCase.js';
import type { IGetApplicationsUseCase } from '#src/use-cases/jobs/IGetApplicationsUseCase.js';
import type { IGetApplicationsPageUseCase } from '#src/use-cases/jobs/IGetApplicationsPageUseCase.js';
import type { IGetApplicationUseCase } from '#src/use-cases/jobs/IGetApplicationUseCase.js';
import type { IUpdateApplicationUseCase } from '#src/use-cases/jobs/IUpdateApplicationUseCase.js';
import type { IDeleteApplicationUseCase } from '#src/use-cases/jobs/IDeleteApplicationUseCase.js';
import type { IBulkUpdateApplicationsUseCase } from '#src/use-cases/jobs/IBulkUpdateApplicationsUseCase.js';
import type { IBulkDeleteApplicationsUseCase } from '#src/use-cases/jobs/IBulkDeleteApplicationsUseCase.js';
import type { IBulkAddTagToApplicationsUseCase } from '#src/use-cases/jobs/IBulkAddTagToApplicationsUseCase.js';
import type {
  ApplicationMapper,
  ApplicationDTO,
  ApplicationConnectionDTO,
} from '#src/interface-adapters/mappers/ApplicationMapper.js';

interface Deps {
  createApplicationUseCase: ICreateApplicationUseCase;
  getApplicationsUseCase: IGetApplicationsUseCase;
  getApplicationsPageUseCase: IGetApplicationsPageUseCase;
  getApplicationUseCase: IGetApplicationUseCase;
  updateApplicationUseCase: IUpdateApplicationUseCase;
  deleteApplicationUseCase: IDeleteApplicationUseCase;
  bulkUpdateApplicationsUseCase: IBulkUpdateApplicationsUseCase;
  bulkDeleteApplicationsUseCase: IBulkDeleteApplicationsUseCase;
  bulkAddTagToApplicationsUseCase: IBulkAddTagToApplicationsUseCase;
  applicationMapper: ApplicationMapper;
}

interface GetApplicationsPageInput {
  status?: ApplicationStatus;
  starred?: boolean;
  search?: string;
  cursor?: string;
  limit?: number;
  likelyGhosted?: boolean;
}

interface BulkUpdateInput {
  status?: ApplicationStatus;
  starred?: boolean;
}

interface CreateInput {
  company: string;
  role: string;
  status?: ApplicationStatus;
  jobUrl?: string;
  location?: string;
  salaryRange?: string;
  description?: string;
  starred?: boolean;
  source?: string;
  followUpAt?: Date | null;
  tags?: string[];
}

interface UpdateInput {
  company?: string;
  role?: string;
  status?: ApplicationStatus;
  jobUrl?: string | null;
  location?: string | null;
  salaryRange?: string | null;
  description?: string | null;
  starred?: boolean;
  source?: string | null;
  followUpAt?: Date | null;
  tags?: string[];
}

export class ApplicationResolver {
  constructor(private readonly deps: Deps) {}

  async getApplications(userId: string, status?: ApplicationStatus): Promise<ApplicationDTO[]> {
    const apps = await this.deps.getApplicationsUseCase.execute({ userId, status });
    return apps.map((a) => this.deps.applicationMapper.toDTO(a));
  }

  async getApplicationsPage(
    userId: string,
    input: GetApplicationsPageInput,
  ): Promise<ApplicationConnectionDTO> {
    const result = await this.deps.getApplicationsPageUseCase.execute({ userId, ...input });
    return {
      items: result.items.map((a) => this.deps.applicationMapper.toDTO(a)),
      nextCursor: result.nextCursor,
      hasNextPage: result.hasNextPage,
    };
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

  async bulkUpdateApplications(
    userId: string,
    ids: string[],
    input: BulkUpdateInput,
  ): Promise<ApplicationDTO[]> {
    const apps = await this.deps.bulkUpdateApplicationsUseCase.execute({
      userId,
      applicationIds: ids,
      ...input,
    });
    return apps.map((a) => this.deps.applicationMapper.toDTO(a));
  }

  async bulkAddTagToApplications(
    userId: string,
    ids: string[],
    tag: string,
  ): Promise<ApplicationDTO[]> {
    const apps = await this.deps.bulkAddTagToApplicationsUseCase.execute({
      userId,
      applicationIds: ids,
      tag,
    });
    return apps.map((a) => this.deps.applicationMapper.toDTO(a));
  }

  async bulkDeleteApplications(userId: string, ids: string[]): Promise<boolean> {
    await this.deps.bulkDeleteApplicationsUseCase.execute({ userId, applicationIds: ids });
    return true;
  }
}
