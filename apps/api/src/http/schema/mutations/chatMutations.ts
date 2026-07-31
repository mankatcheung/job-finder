import { GraphQLError } from 'graphql';
import { builder } from '#src/http/schema/builder.js';
import { ChatMessageInput } from '#src/http/schema/types/inputs/ChatInputs.js';
import { fromCodedError } from '#src/http/errors/AppError.js';
import { ERROR_CODES } from '#src/constants.js';

builder.mutationField('sendChatMessage', (t) =>
  t.field({
    type: 'String',
    args: {
      history: t.arg({ type: [ChatMessageInput], required: true }),
      message: t.arg.string({ required: true }),
    },
    resolve: async (_root, args, ctx) => {
      if (!ctx.user)
        throw new GraphQLError('Unauthorized', { extensions: { code: ERROR_CODES.UNAUTHORIZED } });
      const { chatWithAssistantUseCase } = ctx.diScope.cradle;
      try {
        return await chatWithAssistantUseCase.execute({
          userId: ctx.user.sub,
          history: args.history.map((m) => ({
            role: m.role as 'user' | 'assistant',
            content: m.content,
          })),
          message: args.message,
        });
      } catch (err) {
        throw fromCodedError(err);
      }
    },
  }),
);
