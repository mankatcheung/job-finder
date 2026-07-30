import { builder } from '#src/http/schema/builder.js';

export const ChatMessageInput = builder.inputType('ChatMessageInput', {
  fields: (t) => ({
    role: t.string({ required: true }),
    content: t.string({ required: true }),
  }),
});
