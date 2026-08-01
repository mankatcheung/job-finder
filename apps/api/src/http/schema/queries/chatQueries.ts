import { GraphQLError } from 'graphql';
import { builder } from '#src/http/schema/builder.js';
import { MessageRef } from '#src/http/schema/types/MessageType.js';
import { ConversationRef } from '#src/http/schema/types/ConversationType.js';
import { ERROR_CODES } from '#src/constants.js';

builder.queryField('conversations', (t) =>
  t.field({
    type: [ConversationRef],
    resolve: async (_root, _args, ctx) => {
      if (!ctx.user)
        throw new GraphQLError('Unauthorized', { extensions: { code: ERROR_CODES.UNAUTHORIZED } });
      const { listConversationsUseCase, conversationMapper } = ctx.diScope.cradle;
      const conversations = await listConversationsUseCase.execute(ctx.user.sub);
      return conversations.map((c) => conversationMapper.toDTO(c));
    },
  }),
);

builder.queryField('chatHistory', (t) =>
  t.field({
    type: [MessageRef],
    args: {
      conversationId: t.arg.id({ required: true }),
    },
    resolve: async (_root, args, ctx) => {
      if (!ctx.user)
        throw new GraphQLError('Unauthorized', { extensions: { code: ERROR_CODES.UNAUTHORIZED } });
      const { getChatHistoryUseCase, messageMapper } = ctx.diScope.cradle;
      const messages = await getChatHistoryUseCase.execute({
        userId: ctx.user.sub,
        conversationId: String(args.conversationId),
      });
      return messages.map((m) => messageMapper.toDTO(m));
    },
  }),
);
