import { GraphQLError } from 'graphql';
import { builder } from '#src/http/schema/builder.js';
import { fromCodedError } from '#src/http/errors/AppError.js';
import { ERROR_CODES } from '#src/constants.js';

builder.mutationField('sendChatMessage', (t) =>
  t.field({
    type: 'String',
    args: {
      message: t.arg.string({ required: true }),
    },
    resolve: async (_root, args, ctx) => {
      if (!ctx.user)
        throw new GraphQLError('Unauthorized', { extensions: { code: ERROR_CODES.UNAUTHORIZED } });
      const { chatWithAssistantUseCase } = ctx.diScope.cradle;
      try {
        return await chatWithAssistantUseCase.execute({
          userId: ctx.user.sub,
          message: args.message,
        });
      } catch (err) {
        throw fromCodedError(err);
      }
    },
  }),
);

builder.mutationField('clearChatHistory', (t) =>
  t.field({
    type: 'Boolean',
    resolve: async (_root, _args, ctx) => {
      if (!ctx.user)
        throw new GraphQLError('Unauthorized', { extensions: { code: ERROR_CODES.UNAUTHORIZED } });
      const { clearChatHistoryUseCase } = ctx.diScope.cradle;
      await clearChatHistoryUseCase.execute(ctx.user.sub);
      return true;
    },
  }),
);
