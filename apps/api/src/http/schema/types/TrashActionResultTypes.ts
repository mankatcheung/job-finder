import { builder } from '#src/http/schema/builder.js';
import type { EmptyTrashResult } from '#src/use-cases/jobs/IEmptyTrashUseCase.js';
import type { BulkRestoreApplicationsResult } from '#src/use-cases/jobs/IBulkRestoreApplicationsUseCase.js';

/**
 * Both bulk Trash actions return counts rather than a bare `Boolean`. Emptying
 * a Trash of thirty can succeed for twenty-nine of them, and "false" over a
 * list that is now almost empty tells the user nothing they can act on.
 */
export const EmptyTrashResultRef = builder.objectRef<EmptyTrashResult>('EmptyTrashResult');
EmptyTrashResultRef.implement({
  fields: (t) => ({
    deleted: t.exposeInt('deleted'),
    failed: t.exposeInt('failed'),
  }),
});

export const BulkRestoreResultRef =
  builder.objectRef<BulkRestoreApplicationsResult>('BulkRestoreResult');
BulkRestoreResultRef.implement({
  fields: (t) => ({
    restored: t.exposeInt('restored'),
  }),
});
