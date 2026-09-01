import type { LlmUsageSummary } from '#src/domain/llmUsageEvent/LlmUsageEvent.js';

export interface RecordLlmUsageEventData {
  id: string;
  userId: string;
  provider: string;
  model: string | null;
  promptTokens: number;
  completionTokens: number;
}

export interface ILlmUsageEventRepository {
  record(data: RecordLlmUsageEventData): Promise<void>;
  /** Grouped by provider, most-recently-used first. */
  summarizeByUserId(userId: string): Promise<LlmUsageSummary[]>;
}
