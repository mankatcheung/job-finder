import type { LlmUsageSummaryWithLimit } from '#src/domain/llmUsageEvent/LlmUsageEvent.js';

export interface IGetLlmUsageSummaryUseCase {
  execute(userId: string): Promise<LlmUsageSummaryWithLimit[]>;
}
