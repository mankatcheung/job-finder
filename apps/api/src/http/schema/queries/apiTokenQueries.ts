import { GraphQLError } from 'graphql';
import { builder } from '#src/http/schema/builder.js';
import { ApiTokenRef } from '#src/http/schema/types/ApiTokenType.js';
import { ERROR_CODES } from '#src/constants.js';

builder.queryField('apiTokens', (t) =>
  t.field({
    type: [ApiTokenRef],
    resolve: async (_root, _args, ctx) => {
      if (!ctx.user)
        throw new GraphQLError('Unauthorized', { extensions: { code: ERROR_CODES.UNAUTHORIZED } });
      const { apiTokenResolver } = ctx.diScope.cradle;
      return apiTokenResolver.listApiTokens(ctx.user.sub);
    },
  }),
);
