import { builder } from '@/http/schema/builder.js';
import type { NoteDTO } from '@/interface-adapters/mappers/NoteMapper.js';

export const NoteRef = builder.objectRef<NoteDTO>('Note');
NoteRef.implement({
  fields: (t) => ({
    id: t.exposeID('id'),
    applicationId: t.exposeID('applicationId'),
    content: t.exposeString('content'),
    createdAt: t.exposeString('createdAt'),
    updatedAt: t.exposeString('updatedAt'),
  }),
});
