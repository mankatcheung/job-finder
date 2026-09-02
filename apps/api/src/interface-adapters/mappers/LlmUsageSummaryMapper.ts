import type { LlmUsageSummaryWithLimit } from '#src/domain/llmUsageEvent/LlmUsageEvent.js';

export interface LlmUsageSummaryDTO {
  provider: string;
  requestCount: number;
  promptTokens: number;
  completionTokens: number;
  lastUsedAt: string;
  monthlyTokenLimit: number | null;
  limitReached: boolean;
}

export class LlmUsageSummaryMapper {
  toDTO(summary: LlmUsageSummaryWithLimit): LlmUsageSummaryDTO {
    return {
      provider: summary.provider,
      requestCount: summary.requestCount,
      promptTokens: summary.promptTokens,
      completionTokens: summary.completionTokens,
      lastUsedAt: summary.lastUsedAt.toISOString(),
      monthlyTokenLimit: summary.monthlyTokenLimit,
      limitReached: summary.limitReached,
    };
  }
}
