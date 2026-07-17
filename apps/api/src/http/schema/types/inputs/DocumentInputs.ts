import { builder } from '@/http/schema/builder.js';

export const RequestUploadUrlInput = builder.inputType('RequestUploadUrlInput', {
  fields: (t) => ({
    applicationId: t.id({ required: true }),
    filename: t.string({ required: true }),
    mimeType: t.string({ required: true }),
  }),
});

export const ConfirmDocumentInput = builder.inputType('ConfirmDocumentInput', {
  fields: (t) => ({
    applicationId: t.id({ required: true }),
    storageKey: t.string({ required: true }),
    name: t.string({ required: true }),
    mimeType: t.string({ required: true }),
    sizeBytes: t.int({ required: true }),
  }),
});
