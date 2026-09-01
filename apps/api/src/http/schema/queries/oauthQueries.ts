import { GraphQLError } from 'graphql';
import { builder } from '#src/http/schema/builder.js';
import { LinkedOAuthAccountRef } from '#src/http/schema/types/LinkedOAuthAccountType.js';
import { ERROR_CODES } from '#src/use-cases/errors/errorCodes.js';

builder.queryField('linkedOAuthAccounts', (t) =>
  t.field({
    type: [LinkedOAuthAccountRef],
    resolve: async (_root, _args, ctx) => {
      if (!ctx.user)
        throw new GraphQLError('Unauthorized', { extensions: { code: ERROR_CODES.UNAUTHORIZED } });
      const { oauthResolver } = ctx.diScope.cradle;
      return oauthResolver.listLinkedAccounts(ctx.user.sub);
    },
  }),
);
