import { GraphQLError } from 'graphql';
import { builder } from '#src/http/schema/builder.js';
import { ConversationRef } from '#src/http/schema/types/ConversationType.js';
import { fromCodedError } from '#src/http/errors/AppError.js';
import { ERROR_CODES } from '#src/constants.js';

builder.mutationField('createConversation', (t) =>
  t.field({
    type: ConversationRef,
    resolve: async (_root, _args, ctx) => {
      if (!ctx.user)
        throw new GraphQLError('Unauthorized', { extensions: { code: ERROR_CODES.UNAUTHORIZED } });
      const { createConversationUseCase, conversationMapper } = ctx.diScope.cradle;
      const conversation = await createConversationUseCase.execute(ctx.user.sub);
      return conversationMapper.toDTO(conversation);
    },
  }),
);

builder.mutationField('sendChatMessage', (t) =>
  t.field({
    type: 'String',
    args: {
      conversationId: t.arg.id({ required: true }),
      message: t.arg.string({ required: true }),
    },
    resolve: async (_root, args, ctx) => {
      if (!ctx.user)
        throw new GraphQLError('Unauthorized', { extensions: { code: ERROR_CODES.UNAUTHORIZED } });
      const { chatWithAssistantUseCase } = ctx.diScope.cradle;
      try {
        return await chatWithAssistantUseCase.execute({
          userId: ctx.user.sub,
          conversationId: String(args.conversationId),
          message: args.message,
        });
      } catch (err) {
        throw fromCodedError(err);
      }
    },
  }),
);

builder.mutationField('deleteConversation', (t) =>
  t.field({
    type: 'Boolean',
    args: {
      id: t.arg.id({ required: true }),
    },
    resolve: async (_root, args, ctx) => {
      if (!ctx.user)
        throw new GraphQLError('Unauthorized', { extensions: { code: ERROR_CODES.UNAUTHORIZED } });
      const { deleteConversationUseCase } = ctx.diScope.cradle;
      try {
        await deleteConversationUseCase.execute({
          userId: ctx.user.sub,
          conversationId: String(args.id),
        });
        return true;
      } catch (err) {
        throw fromCodedError(err);
      }
    },
  }),
);
