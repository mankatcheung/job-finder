import { builder } from '#src/http/schema/builder.js';
import type { ImportSummary } from '#src/use-cases/user/IImportUserDataUseCase.js';

export const ImportSummaryRef = builder.objectRef<ImportSummary>('ImportSummary');
ImportSummaryRef.implement({
  fields: (t) => ({
    applicationsImported: t.exposeInt('applicationsImported'),
    applicationsSkipped: t.exposeInt('applicationsSkipped'),
    notesImported: t.exposeInt('notesImported'),
    documentsSkipped: t.exposeInt('documentsSkipped'),
  }),
});
