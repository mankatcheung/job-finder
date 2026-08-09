import { builder } from '#src/http/schema/builder.js';
import type { DocumentVersionOutcome } from '#src/use-cases/documents/GetDocumentVersionOutcomesUseCase.js';

export const DocumentVersionOutcomeRef =
  builder.objectRef<DocumentVersionOutcome>('DocumentVersionOutcome');
DocumentVersionOutcomeRef.implement({
  fields: (t) => ({
    documentType: t.exposeString('documentType'),
    version: t.exposeString('version', { nullable: true }),
    applicationCount: t.exposeInt('applicationCount'),
    interviewCount: t.exposeInt('interviewCount'),
    interviewRate: t.exposeInt('interviewRate'),
  }),
});
