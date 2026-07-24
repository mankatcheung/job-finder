import type { IApplicationRepository } from '@/use-cases/ports/IApplicationRepository.js';
import { PAGINATION } from '@/constants.js';
import type {
  IGetApplicationsPageUseCase,
  GetApplicationsPageInput,
  GetApplicationsPageOutput,
} from '@/use-cases/jobs/IGetApplicationsPageUseCase.js';

interface Deps {
  applicationRepository: IApplicationRepository;
}

export class GetApplicationsPageUseCase implements IGetApplicationsPageUseCase {
  constructor(private readonly deps: Deps) {}

  async execute(input: GetApplicationsPageInput): Promise<GetApplicationsPageOutput> {
    const limit = Math.max(
      1,
      Math.min(input.limit ?? PAGINATION.DEFAULT_LIMIT, PAGINATION.MAX_LIMIT),
    );

    const { items, hasNextPage } = await this.deps.applicationRepository.findPageByUserId(
      input.userId,
      { status: input.status, starred: input.starred, search: input.search },
      { cursor: input.cursor, limit },
    );

    return {
      items,
      hasNextPage,
      nextCursor: hasNextPage ? items[items.length - 1].id : null,
    };
  }
}
