import { GraphQLError } from 'graphql';
import { builder } from '#src/http/schema/builder.js';
import { ERROR_CODES } from '#src/use-cases/errors/errorCodes.js';

builder.mutationField('revokeMcpOAuthGrant', (t) =>
  t.boolean({
    args: {
      id: t.arg.id({ required: true }),
    },
    resolve: async (_root, args, ctx) => {
      if (!ctx.user)
        throw new GraphQLError('Unauthorized', { extensions: { code: ERROR_CODES.UNAUTHORIZED } });
      const { mcpOAuthGrantResolver } = ctx.diScope.cradle;
      return mcpOAuthGrantResolver.revokeGrant(ctx.user.sub, String(args.id));
    },
  }),
);
