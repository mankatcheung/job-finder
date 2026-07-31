import { builder } from '#src/http/schema/builder.js';
import type { ResumeMatchScore } from '#src/use-cases/application/ComputeResumeMatchScoreUseCase.js';

export const ResumeMatchScoreRef = builder.objectRef<ResumeMatchScore>('ResumeMatchScore');
ResumeMatchScoreRef.implement({
  fields: (t) => ({
    score: t.exposeInt('score'),
    label: t.exposeString('label'),
    matchedKeywords: t.exposeStringList('matchedKeywords'),
    missingKeywords: t.exposeStringList('missingKeywords'),
    summary: t.exposeString('summary'),
  }),
});
