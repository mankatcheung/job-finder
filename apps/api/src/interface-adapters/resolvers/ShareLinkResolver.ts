import type { CreateShareLinkUseCase } from '#src/use-cases/shareLinks/CreateShareLinkUseCase.js';
import type { ListShareLinksUseCase } from '#src/use-cases/shareLinks/ListShareLinksUseCase.js';
import type { DeleteShareLinkUseCase } from '#src/use-cases/shareLinks/DeleteShareLinkUseCase.js';
import type {
  GetSharedSummaryUseCase,
  StatusCount,
} from '#src/use-cases/shareLinks/GetSharedSummaryUseCase.js';
import type {
  ShareLinkMapper,
  ShareLinkDTO,
} from '#src/interface-adapters/mappers/ShareLinkMapper.js';

interface Deps {
  createShareLinkUseCase: CreateShareLinkUseCase;
  listShareLinksUseCase: ListShareLinksUseCase;
  deleteShareLinkUseCase: DeleteShareLinkUseCase;
  getSharedSummaryUseCase: GetSharedSummaryUseCase;
  shareLinkMapper: ShareLinkMapper;
}

export interface CreateShareLinkResult {
  id: string;
  name: string;
  token: string;
  createdAt: string;
}

export interface SharedSummaryResult {
  statusCounts: StatusCount[];
  totalApplications: number;
  totalInterviews: number;
  upcomingInterviews: number;
  applicationsUpdatedLast7Days: number;
  generatedAt: string;
}

export class ShareLinkResolver {
  constructor(private readonly deps: Deps) {}

  async createShareLink(userId: string, name: string): Promise<CreateShareLinkResult> {
    const { shareLink, rawToken } = await this.deps.createShareLinkUseCase.execute({
      userId,
      name,
    });
    const dto = this.deps.shareLinkMapper.toDTO(shareLink);
    return { id: dto.id, name: dto.name, token: rawToken, createdAt: dto.createdAt };
  }

  async deleteShareLink(userId: string, id: string): Promise<boolean> {
    await this.deps.deleteShareLinkUseCase.execute(id, userId);
    return true;
  }

  async listShareLinks(userId: string): Promise<ShareLinkDTO[]> {
    const links = await this.deps.listShareLinksUseCase.execute(userId);
    return links.map((link) => this.deps.shareLinkMapper.toDTO(link));
  }

  async getSharedSummary(token: string): Promise<SharedSummaryResult | null> {
    const summary = await this.deps.getSharedSummaryUseCase.execute(token);
    if (!summary) return null;
    return { ...summary, generatedAt: summary.generatedAt.toISOString() };
  }
}
