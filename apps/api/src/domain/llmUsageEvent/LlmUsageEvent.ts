export type LlmUsageEvent = {
  id: string;
  userId: string;
  provider: string;
  model: string | null;
  promptTokens: number;
  completionTokens: number;
  createdAt: Date;
};

/**
 * One provider's usage since the cutoff the caller asked for — the shape
 * `ILlmUsageEventRepository.summarizeByUserId` returns, aggregated across
 * every model that provider's key has been used with (JEF-250). No cost
 * estimate: list prices drift, and a stale number is worse than none. Token
 * counts only, scoped to the current calendar month by
 * `GetLlmUsageSummaryUseCase` — older events aren't deleted, just excluded.
 */
export type LlmUsageSummary = {
  provider: string;
  requestCount: number;
  promptTokens: number;
  completionTokens: number;
  lastUsedAt: Date;
};
