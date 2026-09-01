export interface LlmUsageSummaryOutput {
  provider: string;
  requestCount: number;
  promptTokens: number;
  completionTokens: number;
  lastUsedAt: Date;
  /** Null when the provider/model combination has no known list price — see `llmPricing.ts`. */
  estimatedCostUsd: number | null;
}

export interface IGetLlmUsageSummaryUseCase {
  execute(userId: string): Promise<LlmUsageSummaryOutput[]>;
}
