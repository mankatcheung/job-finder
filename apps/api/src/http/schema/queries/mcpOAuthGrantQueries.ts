import { GraphQLError } from 'graphql';
import { builder } from '#src/http/schema/builder.js';
import { McpOAuthGrantRef } from '#src/http/schema/types/McpOAuthGrantType.js';
import { ERROR_CODES } from '#src/use-cases/errors/errorCodes.js';

builder.queryField('mcpOAuthGrants', (t) =>
  t.field({
    type: [McpOAuthGrantRef],
    resolve: async (_root, _args, ctx) => {
      if (!ctx.user)
        throw new GraphQLError('Unauthorized', { extensions: { code: ERROR_CODES.UNAUTHORIZED } });
      const { mcpOAuthGrantResolver } = ctx.diScope.cradle;
      return mcpOAuthGrantResolver.listGrants(ctx.user.sub);
    },
  }),
);
