import { builder } from '#src/http/schema/builder.js';
import type { LlmKeyStatus } from '#src/use-cases/user/IGetLlmKeyStatusUseCase.js';

export const LlmKeyStatusRef = builder.objectRef<LlmKeyStatus>('LlmKeyStatus');
LlmKeyStatusRef.implement({
  fields: (t) => ({
    configured: t.exposeBoolean('configured'),
    provider: t.exposeString('provider', { nullable: true }),
    model: t.exposeString('model', { nullable: true }),
    baseUrl: t.exposeString('baseUrl', { nullable: true }),
  }),
});
