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
 * One provider's usage across every call recorded for a user — the shape
 * `ILlmUsageEventRepository.summarizeByUserId` returns, aggregated across
 * every model that provider's key has been used with (JEF-250). Cost is
 * computed separately (`use-cases/shared/llmPricing.ts`) rather than stored
 * here, since it's derived from a pricing table that can change independent
 * of the events themselves.
 */
export type LlmUsageSummary = {
  provider: string;
  requestCount: number;
  promptTokens: number;
  completionTokens: number;
  lastUsedAt: Date;
};
