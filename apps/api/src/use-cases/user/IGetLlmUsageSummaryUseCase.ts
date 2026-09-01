import type { LlmUsageSummary } from '#src/domain/llmUsageEvent/LlmUsageEvent.js';

export interface IGetLlmUsageSummaryUseCase {
  execute(userId: string): Promise<LlmUsageSummary[]>;
}
