import { builder } from '@/http/schema/builder.js';
import type { DocumentDTO } from '@/interface-adapters/mappers/DocumentMapper.js';

export const DocumentRef = builder.objectRef<DocumentDTO>('Document');
DocumentRef.implement({
  fields: (t) => ({
    id: t.exposeID('id'),
    applicationId: t.exposeID('applicationId'),
    name: t.exposeString('name'),
    mimeType: t.exposeString('mimeType'),
    sizeBytes: t.exposeInt('sizeBytes'),
    url: t.exposeString('url'),
    createdAt: t.exposeString('createdAt'),
  }),
});
