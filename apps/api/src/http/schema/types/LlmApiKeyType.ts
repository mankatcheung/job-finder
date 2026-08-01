import { builder } from '#src/http/schema/builder.js';
import type { LlmApiKeyDTO } from '#src/interface-adapters/mappers/LlmApiKeyMapper.js';

export const LlmApiKeyRef = builder.objectRef<LlmApiKeyDTO>('LlmApiKey');
LlmApiKeyRef.implement({
  fields: (t) => ({
    provider: t.exposeString('provider'),
    model: t.exposeString('model', { nullable: true }),
    baseUrl: t.exposeString('baseUrl', { nullable: true }),
  }),
});
