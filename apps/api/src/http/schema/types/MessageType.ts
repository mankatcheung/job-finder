import { builder } from '#src/http/schema/builder.js';
import type { MessageDTO } from '#src/interface-adapters/mappers/MessageMapper.js';

export const MessageRef = builder.objectRef<MessageDTO>('Message');

builder.objectType(MessageRef, {
  fields: (t) => ({
    id: t.exposeString('id'),
    role: t.exposeString('role'),
    content: t.exposeString('content'),
    createdAt: t.exposeString('createdAt'),
  }),
});
