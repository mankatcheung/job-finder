import type { LlmUsageSummary } from '#src/domain/llmUsageEvent/LlmUsageEvent.js';
import type { ILlmUsageEventRepository } from '#src/use-cases/ports/ILlmUsageEventRepository.js';
import type { IGetLlmUsageSummaryUseCase } from '#src/use-cases/user/IGetLlmUsageSummaryUseCase.js';

interface Deps {
  llmUsageEventRepository: ILlmUsageEventRepository;
  now: () => Date;
}

/**
 * "This calendar month" is the policy decision that lives here, not in the
 * repository — usage resets monthly by construction (nothing to sum before
 * the 1st), no cron job or deletion required. UTC month boundary, matching
 * how `createdAt` is stored.
 */
export class GetLlmUsageSummaryUseCase implements IGetLlmUsageSummaryUseCase {
  constructor(private readonly deps: Deps) {}

  async execute(userId: string): Promise<LlmUsageSummary[]> {
    const now = this.deps.now();
    const startOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    return this.deps.llmUsageEventRepository.summarizeByUserId(userId, startOfMonth);
  }
}
