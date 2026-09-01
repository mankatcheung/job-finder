import type { ILlmUsageEventRepository } from '#src/use-cases/ports/ILlmUsageEventRepository.js';
import type { ILlmApiKeyRepository } from '#src/use-cases/ports/ILlmApiKeyRepository.js';
import { estimateCostUsd } from '#src/use-cases/shared/llmPricing.js';
import type {
  IGetLlmUsageSummaryUseCase,
  LlmUsageSummaryOutput,
} from '#src/use-cases/user/IGetLlmUsageSummaryUseCase.js';

interface Deps {
  llmUsageEventRepository: ILlmUsageEventRepository;
  llmApiKeyRepository: ILlmApiKeyRepository;
}

/**
 * Usage is aggregated per provider (`LlmUsageEvent` doesn't distinguish
 * model at the summary level — see `LlmUsageSummary`'s doc comment), but
 * cost pricing is per model. This attaches the *currently configured* model
 * for that provider's `LlmApiKey` as the one to price against — accurate
 * for the common case (a user rarely changes their model), an approximation
 * if they've switched models since some of the recorded usage.
 */
export class GetLlmUsageSummaryUseCase implements IGetLlmUsageSummaryUseCase {
  constructor(private readonly deps: Deps) {}

  async execute(userId: string): Promise<LlmUsageSummaryOutput[]> {
    const [summaries, keys] = await Promise.all([
      this.deps.llmUsageEventRepository.summarizeByUserId(userId),
      this.deps.llmApiKeyRepository.findAllByUserId(userId),
    ]);
    const modelByProvider = new Map(keys.map((k) => [k.provider, k.model]));

    return summaries.map((summary) => ({
      ...summary,
      estimatedCostUsd: estimateCostUsd(
        summary.provider,
        modelByProvider.get(summary.provider) ?? null,
        summary.promptTokens,
        summary.completionTokens,
      ),
    }));
  }
}
