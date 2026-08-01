import { GraphQLError } from 'graphql';
import { builder } from '#src/http/schema/builder.js';
import { MessageRef } from '#src/http/schema/types/MessageType.js';
import { ERROR_CODES } from '#src/constants.js';

builder.queryField('chatHistory', (t) =>
  t.field({
    type: [MessageRef],
    resolve: async (_root, _args, ctx) => {
      if (!ctx.user)
        throw new GraphQLError('Unauthorized', { extensions: { code: ERROR_CODES.UNAUTHORIZED } });
      const { getChatHistoryUseCase, messageMapper } = ctx.diScope.cradle;
      const messages = await getChatHistoryUseCase.execute(ctx.user.sub);
      return messages.map((m) => messageMapper.toDTO(m));
    },
  }),
);
