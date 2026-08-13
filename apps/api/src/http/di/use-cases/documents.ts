import { asClass, Lifetime, type NameAndRegistrationPair } from 'awilix';

import { RequestUploadUrlUseCase } from '#src/use-cases/documents/RequestUploadUrlUseCase.js';
import { ConfirmDocumentUseCase } from '#src/use-cases/documents/ConfirmDocumentUseCase.js';
import { GetDocumentsUseCase } from '#src/use-cases/documents/GetDocumentsUseCase.js';
import { DeleteDocumentUseCase } from '#src/use-cases/documents/DeleteDocumentUseCase.js';
import { CreateDocumentDraftUseCase } from '#src/use-cases/documents/CreateDocumentDraftUseCase.js';
import { UpdateDocumentDraftContentUseCase } from '#src/use-cases/documents/UpdateDocumentDraftContentUseCase.js';
import { GetDocumentDraftsUseCase } from '#src/use-cases/documents/GetDocumentDraftsUseCase.js';
import { GetDocumentDraftUseCase } from '#src/use-cases/documents/GetDocumentDraftUseCase.js';
import { DeleteDocumentDraftUseCase } from '#src/use-cases/documents/DeleteDocumentDraftUseCase.js';
import { ExtractDocumentTextUseCase } from '#src/use-cases/documents/ExtractDocumentTextUseCase.js';
import { ExportDocumentDraftToPdfUseCase } from '#src/use-cases/documents/ExportDocumentDraftToPdfUseCase.js';
import { GetDocumentVersionOutcomesUseCase } from '#src/use-cases/documents/GetDocumentVersionOutcomesUseCase.js';

import type { Cradle } from '../types.js';

export const documents = {
  requestUploadUrlUseCase: asClass(RequestUploadUrlUseCase, { lifetime: Lifetime.TRANSIENT }),
  confirmDocumentUseCase: asClass(ConfirmDocumentUseCase, { lifetime: Lifetime.TRANSIENT }),
  getDocumentsUseCase: asClass(GetDocumentsUseCase, { lifetime: Lifetime.TRANSIENT }),
  deleteDocumentUseCase: asClass(DeleteDocumentUseCase, { lifetime: Lifetime.TRANSIENT }),
  createDocumentDraftUseCase: asClass(CreateDocumentDraftUseCase, {
    lifetime: Lifetime.TRANSIENT,
  }),
  updateDocumentDraftContentUseCase: asClass(UpdateDocumentDraftContentUseCase, {
    lifetime: Lifetime.TRANSIENT,
  }),
  getDocumentDraftsUseCase: asClass(GetDocumentDraftsUseCase, { lifetime: Lifetime.TRANSIENT }),
  getDocumentDraftUseCase: asClass(GetDocumentDraftUseCase, { lifetime: Lifetime.TRANSIENT }),
  deleteDocumentDraftUseCase: asClass(DeleteDocumentDraftUseCase, {
    lifetime: Lifetime.TRANSIENT,
  }),
  extractDocumentTextUseCase: asClass(ExtractDocumentTextUseCase, {
    lifetime: Lifetime.TRANSIENT,
  }),
  exportDocumentDraftToPdfUseCase: asClass(ExportDocumentDraftToPdfUseCase, {
    lifetime: Lifetime.TRANSIENT,
  }),
  getDocumentVersionOutcomesUseCase: asClass(GetDocumentVersionOutcomesUseCase, {
    lifetime: Lifetime.TRANSIENT,
  }),
} satisfies NameAndRegistrationPair<Cradle>;
