import { GraphQLError } from 'graphql';
import { builder } from '#src/http/schema/builder.js';
import { ConversationRef } from '#src/http/schema/types/ConversationType.js';
import { fromCodedError } from '#src/http/errors/AppError.js';
import { ERROR_CODES } from '#src/constants.js';

builder.mutationField('createConversation', (t) =>
  t.field({
    type: ConversationRef,
    args: {
      provider: t.arg.string({ required: false }),
      model: t.arg.string({ required: false }),
    },
    resolve: async (_root, args, ctx) => {
      if (!ctx.user)
        throw new GraphQLError('Unauthorized', { extensions: { code: ERROR_CODES.UNAUTHORIZED } });
      const { createConversationUseCase, conversationMapper } = ctx.diScope.cradle;
      try {
        const conversation = await createConversationUseCase.execute({
          userId: ctx.user.sub,
          provider: args.provider,
          model: args.model,
        });
        return conversationMapper.toDTO(conversation);
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
