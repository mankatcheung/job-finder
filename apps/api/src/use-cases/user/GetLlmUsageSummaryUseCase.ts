import type { LlmUsageSummaryWithLimit } from '#src/domain/llmUsageEvent/LlmUsageEvent.js';
import type { ILlmUsageEventRepository } from '#src/use-cases/ports/ILlmUsageEventRepository.js';
import type { ILlmApiKeyRepository } from '#src/use-cases/ports/ILlmApiKeyRepository.js';
import type { IGetLlmUsageSummaryUseCase } from '#src/use-cases/user/IGetLlmUsageSummaryUseCase.js';
import { isLimitReached, startOfUtcMonth } from '#src/use-cases/shared/tokenLimit.js';

interface Deps {
  llmUsageEventRepository: ILlmUsageEventRepository;
  llmApiKeyRepository: ILlmApiKeyRepository;
  now: () => Date;
}

/**
 * "This calendar month" is the policy decision that lives in
 * `shared/tokenLimit.ts`, not in the repository — usage resets monthly by
 * construction (nothing to sum before the 1st), no cron job or deletion
 * required.
 *
 * Each provider's summary carries the ceiling set on its key and whether it
 * has been passed (JEF-258), decided by the same helper the provider factory
 * refuses on. A provider with a key but no usage this month simply has no
 * row here — it cannot have reached a limit — so the settings page reads the
 * ceiling itself off `LlmApiKey.monthlyTokenLimit`.
 */
export class GetLlmUsageSummaryUseCase implements IGetLlmUsageSummaryUseCase {
  constructor(private readonly deps: Deps) {}

  async execute(userId: string): Promise<LlmUsageSummaryWithLimit[]> {
    const since = startOfUtcMonth(this.deps.now());
    const [summaries, keys] = await Promise.all([
      this.deps.llmUsageEventRepository.summarizeByUserId(userId, since),
      this.deps.llmApiKeyRepository.findAllByUserId(userId),
    ]);

    const limitByProvider = new Map(keys.map((k) => [k.provider, k.monthlyTokenLimit]));

    return summaries.map((summary) => {
      const monthlyTokenLimit = limitByProvider.get(summary.provider) ?? null;
      return {
        ...summary,
        monthlyTokenLimit,
        limitReached: isLimitReached(
          summary.promptTokens + summary.completionTokens,
          monthlyTokenLimit,
        ),
      };
    });
  }
}
