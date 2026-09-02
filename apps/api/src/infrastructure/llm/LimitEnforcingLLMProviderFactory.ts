import { LlmLimitReachedError } from '#src/use-cases/errors/DomainError.js';
import type { ILlmApiKeyRepository } from '#src/use-cases/ports/ILlmApiKeyRepository.js';
import type { ILlmUsageEventRepository } from '#src/use-cases/ports/ILlmUsageEventRepository.js';
import type { ILLMProvider } from '#src/use-cases/ports/ILLMProvider.js';
import type {
  ILLMProviderFactory,
  LLMProviderCredentials,
} from '#src/use-cases/ports/ILLMProviderFactory.js';
import type { IUserRepository } from '#src/use-cases/ports/IUserRepository.js';
import { isLimitReached, startOfUtcMonth } from '#src/use-cases/shared/tokenLimit.js';

interface Deps {
  userLlmProviderFactory: ILLMProviderFactory;
  userRepository: IUserRepository;
  llmApiKeyRepository: ILlmApiKeyRepository;
  llmUsageEventRepository: ILlmUsageEventRepository;
  now: () => Date;
}

/**
 * Refuses a key that has spent its monthly token limit (JEF-258).
 *
 * A decorator over `ILLMProviderFactory` rather than a check inside each AI
 * use case, following the same inner/outer shape as `Cached*Repository` and
 * `BlocklistingSessionRepository`: `forUser` is the one place every real AI
 * feature resolves a provider through, so every call site is covered by
 * construction and no future one has to remember.
 *
 * **`trackUsage: false` is not enforced.** That flag marks a call whose
 * tokens are deliberately not counted — today only `TestLlmApiKeyUseCase`'s
 * "test a saved key" path. A call that does not count toward the limit must
 * not be refused by it, and blocking it would take away the one button that
 * diagnoses the key that is paused. It still spends a few tokens of the
 * user's money (`LLM.TEST_API_KEY_MAX_TOKENS`), which is the deliberate
 * trade.
 *
 * `fromCredentials` is untouched for the same reason and one more: it is for
 * a key that has not been saved yet, so there is no limit to read.
 *
 * The month's usage comes from the primary database, so there is no
 * fail-open decision to make here — if that read fails the request was going
 * to fail anyway. This deliberately does not fail open the way the Redis
 * paths do: a spending limit that stops applying under load is not a limit.
 */
export class LimitEnforcingLLMProviderFactory implements ILLMProviderFactory {
  constructor(private readonly deps: Deps) {}

  async forUser(
    userId: string,
    provider?: string,
    model?: string | null,
    trackUsage = true,
  ): Promise<ILLMProvider | null> {
    if (trackUsage) {
      await this.assertWithinLimit(userId, provider);
    }
    return this.deps.userLlmProviderFactory.forUser(userId, provider, model, trackUsage);
  }

  fromCredentials(credentials: LLMProviderCredentials): ILLMProvider | null {
    return this.deps.userLlmProviderFactory.fromCredentials(credentials);
  }

  /**
   * Resolves the same provider the inner factory would, and throws when that
   * key has passed its limit. Resolving it twice is the price of leaving the
   * inner factory's own logic untouched; both reads are indexed and the
   * result is a single row.
   */
  private async assertWithinLimit(userId: string, provider?: string): Promise<void> {
    let resolvedProvider = provider;
    if (!resolvedProvider) {
      const user = await this.deps.userRepository.findById(userId);
      resolvedProvider = user?.defaultLlmProvider ?? undefined;
    }
    // No provider and no key are the inner factory's cases to report: it
    // returns null and the caller raises AI_NOT_CONFIGURED.
    if (!resolvedProvider) return;

    const key = await this.deps.llmApiKeyRepository.findByUserIdAndProvider(
      userId,
      resolvedProvider,
    );
    if (!key || key.monthlyTokenLimit === null) return;

    const now = this.deps.now();
    const since = startOfUtcMonth(now);
    const summaries = await this.deps.llmUsageEventRepository.summarizeByUserId(userId, since);
    const used = summaries.find((s) => s.provider === resolvedProvider);
    const usedTokens = used ? used.promptTokens + used.completionTokens : 0;

    if (isLimitReached(usedTokens, key.monthlyTokenLimit)) {
      throw new LlmLimitReachedError(resolvedProvider, nextUtcMonth(now));
    }
  }
}

/** When the allowance refills — the 1st of the following month, UTC. */
function nextUtcMonth(now: Date): Date {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
}
