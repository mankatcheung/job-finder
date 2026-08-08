import type { IApplicationRepository } from '#src/use-cases/ports/IApplicationRepository.js';
import { PAGINATION } from '#src/constants.js';
import type {
  IGetApplicationsPageUseCase,
  GetApplicationsPageInput,
  GetApplicationsPageOutput,
} from '#src/use-cases/jobs/IGetApplicationsPageUseCase.js';

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
      {
        status: input.status,
        starred: input.starred,
        search: input.search,
        likelyGhosted: input.likelyGhosted,
      },
      { cursor: input.cursor, limit },
    );

    return {
      items,
      hasNextPage,
      nextCursor: hasNextPage ? items[items.length - 1].id : null,
    };
  }
}
