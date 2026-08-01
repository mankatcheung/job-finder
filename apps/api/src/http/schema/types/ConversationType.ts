import { builder } from '#src/http/schema/builder.js';
import type { ConversationDTO } from '#src/interface-adapters/mappers/ConversationMapper.js';

export const ConversationRef = builder.objectRef<ConversationDTO>('Conversation');

builder.objectType(ConversationRef, {
  fields: (t) => ({
    id: t.exposeString('id'),
    title: t.exposeString('title', { nullable: true }),
    llmProvider: t.exposeString('llmProvider', { nullable: true }),
    llmModel: t.exposeString('llmModel', { nullable: true }),
    createdAt: t.exposeString('createdAt'),
    updatedAt: t.exposeString('updatedAt'),
  }),
});
