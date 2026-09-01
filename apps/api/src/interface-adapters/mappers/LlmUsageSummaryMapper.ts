import type { LlmUsageSummary } from '#src/domain/llmUsageEvent/LlmUsageEvent.js';

export interface LlmUsageSummaryDTO {
  provider: string;
  requestCount: number;
  promptTokens: number;
  completionTokens: number;
  lastUsedAt: string;
}

export class LlmUsageSummaryMapper {
  toDTO(summary: LlmUsageSummary): LlmUsageSummaryDTO {
    return {
      provider: summary.provider,
      requestCount: summary.requestCount,
      promptTokens: summary.promptTokens,
      completionTokens: summary.completionTokens,
      lastUsedAt: summary.lastUsedAt.toISOString(),
    };
  }
}
