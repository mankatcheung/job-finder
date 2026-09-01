import { builder } from '#src/http/schema/builder.js';
import type { LlmUsageSummaryDTO } from '#src/interface-adapters/mappers/LlmUsageSummaryMapper.js';

export const LlmUsageSummaryRef = builder.objectRef<LlmUsageSummaryDTO>('LlmUsageSummary');
LlmUsageSummaryRef.implement({
  fields: (t) => ({
    provider: t.exposeString('provider'),
    requestCount: t.exposeInt('requestCount'),
    promptTokens: t.exposeInt('promptTokens'),
    completionTokens: t.exposeInt('completionTokens'),
    lastUsedAt: t.exposeString('lastUsedAt'),
    estimatedCostUsd: t.exposeFloat('estimatedCostUsd', { nullable: true }),
  }),
});
