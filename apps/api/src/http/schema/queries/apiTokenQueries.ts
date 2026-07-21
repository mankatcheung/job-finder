import { GraphQLError } from 'graphql';
import { builder } from '@/http/schema/builder.js';
import { ApiTokenRef } from '@/http/schema/types/ApiTokenType.js';
import { ERROR_CODES } from '@/constants.js';

builder.queryField('apiTokens', (t) =>
  t.field({
    type: [ApiTokenRef],
    resolve: async (_root, _args, ctx) => {
      if (!ctx.user)
        throw new GraphQLError('Unauthorized', { extensions: { code: ERROR_CODES.UNAUTHORIZED } });
      const { listApiTokensUseCase, apiTokenMapper } = ctx.diScope.cradle;
      const tokens = await listApiTokensUseCase.execute(ctx.user.sub);
      return tokens.map((token) => apiTokenMapper.toDTO(token));
    },
  }),
);
