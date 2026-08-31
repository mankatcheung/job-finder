import { builder } from '#src/http/schema/builder.js';
import type { TestLlmApiKeyResult } from '#src/use-cases/user/ITestLlmApiKeyUseCase.js';

export const TestLlmApiKeyResultRef = builder.objectRef<TestLlmApiKeyResult>('TestLlmApiKeyResult');
TestLlmApiKeyResultRef.implement({
  fields: (t) => ({
    ok: t.exposeBoolean('ok'),
    error: t.exposeString('error', { nullable: true }),
  }),
});
