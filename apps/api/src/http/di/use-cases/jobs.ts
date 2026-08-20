import { RestoreApplicationUseCase } from '#src/use-cases/jobs/RestoreApplicationUseCase.js';
import { PermanentlyDeleteApplicationUseCase } from '#src/use-cases/jobs/PermanentlyDeleteApplicationUseCase.js';
import { ListTrashedApplicationsUseCase } from '#src/use-cases/jobs/ListTrashedApplicationsUseCase.js';
import { PurgeExpiredApplicationsUseCase } from '#src/use-cases/jobs/PurgeExpiredApplicationsUseCase.js';
import { BulkRestoreApplicationsUseCase } from '#src/use-cases/jobs/BulkRestoreApplicationsUseCase.js';
import { EmptyTrashUseCase } from '#src/use-cases/jobs/EmptyTrashUseCase.js';
import { asClass, Lifetime, type NameAndRegistrationPair } from 'awilix';

import { CreateApplicationUseCase } from '#src/use-cases/jobs/CreateApplicationUseCase.js';
import { GetApplicationsUseCase } from '#src/use-cases/jobs/GetApplicationsUseCase.js';
import { GetApplicationsPageUseCase } from '#src/use-cases/jobs/GetApplicationsPageUseCase.js';
import { GetApplicationUseCase } from '#src/use-cases/jobs/GetApplicationUseCase.js';
import { UpdateApplicationUseCase } from '#src/use-cases/jobs/UpdateApplicationUseCase.js';
import { DeleteApplicationUseCase } from '#src/use-cases/jobs/DeleteApplicationUseCase.js';
import { BulkUpdateApplicationsUseCase } from '#src/use-cases/jobs/BulkUpdateApplicationsUseCase.js';
import { BulkDeleteApplicationsUseCase } from '#src/use-cases/jobs/BulkDeleteApplicationsUseCase.js';
import { BulkAddTagToApplicationsUseCase } from '#src/use-cases/jobs/BulkAddTagToApplicationsUseCase.js';

import type { Cradle } from '../types.js';

export const jobs = {
  createApplicationUseCase: asClass(CreateApplicationUseCase, {
    lifetime: Lifetime.TRANSIENT,
  }),
  getApplicationsUseCase: asClass(GetApplicationsUseCase, { lifetime: Lifetime.TRANSIENT }),
  getApplicationsPageUseCase: asClass(GetApplicationsPageUseCase, {
    lifetime: Lifetime.TRANSIENT,
  }),
  getApplicationUseCase: asClass(GetApplicationUseCase, { lifetime: Lifetime.TRANSIENT }),
  updateApplicationUseCase: asClass(UpdateApplicationUseCase, {
    lifetime: Lifetime.TRANSIENT,
  }),
  deleteApplicationUseCase: asClass(DeleteApplicationUseCase, {
    lifetime: Lifetime.TRANSIENT,
  }),
  bulkUpdateApplicationsUseCase: asClass(BulkUpdateApplicationsUseCase, {
    lifetime: Lifetime.TRANSIENT,
  }),
  bulkDeleteApplicationsUseCase: asClass(BulkDeleteApplicationsUseCase, {
    lifetime: Lifetime.TRANSIENT,
  }),
  bulkAddTagToApplicationsUseCase: asClass(BulkAddTagToApplicationsUseCase, {
    lifetime: Lifetime.TRANSIENT,
  }),
  restoreApplicationUseCase: asClass(RestoreApplicationUseCase, { lifetime: Lifetime.TRANSIENT }),
  permanentlyDeleteApplicationUseCase: asClass(PermanentlyDeleteApplicationUseCase, {
    lifetime: Lifetime.TRANSIENT,
  }),
  listTrashedApplicationsUseCase: asClass(ListTrashedApplicationsUseCase, {
    lifetime: Lifetime.TRANSIENT,
  }),
  purgeExpiredApplicationsUseCase: asClass(PurgeExpiredApplicationsUseCase, {
    lifetime: Lifetime.TRANSIENT,
  }),
  bulkRestoreApplicationsUseCase: asClass(BulkRestoreApplicationsUseCase, {
    lifetime: Lifetime.TRANSIENT,
  }),
  emptyTrashUseCase: asClass(EmptyTrashUseCase, { lifetime: Lifetime.TRANSIENT }),
} satisfies NameAndRegistrationPair<Cradle>;
