import type { LlmUsageSummaryOutput } from '#src/use-cases/user/IGetLlmUsageSummaryUseCase.js';

export interface LlmUsageSummaryDTO {
  provider: string;
  requestCount: number;
  promptTokens: number;
  completionTokens: number;
  lastUsedAt: string;
  estimatedCostUsd: number | null;
}

export class LlmUsageSummaryMapper {
  toDTO(summary: LlmUsageSummaryOutput): LlmUsageSummaryDTO {
    return {
      provider: summary.provider,
      requestCount: summary.requestCount,
      promptTokens: summary.promptTokens,
      completionTokens: summary.completionTokens,
      lastUsedAt: summary.lastUsedAt.toISOString(),
      estimatedCostUsd: summary.estimatedCostUsd,
    };
  }
}
