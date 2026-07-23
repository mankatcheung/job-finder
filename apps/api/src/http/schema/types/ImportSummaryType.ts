import { builder } from '@/http/schema/builder.js';
import type { ImportSummary } from '@/use-cases/user/IImportUserDataUseCase.js';

export const ImportSummaryRef = builder.objectRef<ImportSummary>('ImportSummary');
ImportSummaryRef.implement({
  fields: (t) => ({
    applicationsImported: t.exposeInt('applicationsImported'),
    applicationsSkipped: t.exposeInt('applicationsSkipped'),
    notesImported: t.exposeInt('notesImported'),
    documentsSkipped: t.exposeInt('documentsSkipped'),
  }),
});
