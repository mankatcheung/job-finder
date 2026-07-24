import { GraphQLError } from 'graphql';
import { builder } from '@/http/schema/builder.js';
import { ERROR_CODES } from '@/constants.js';

builder.mutationField('revokeSession', (t) =>
  t.boolean({
    args: {
      id: t.arg.id({ required: true }),
    },
    resolve: async (_root, args, ctx) => {
      if (!ctx.user)
        throw new GraphQLError('Unauthorized', { extensions: { code: ERROR_CODES.UNAUTHORIZED } });
      const { sessionResolver } = ctx.diScope.cradle;
      return sessionResolver.revokeSession(ctx.user.sub, String(args.id));
    },
  }),
);

builder.mutationField('revokeOtherSessions', (t) =>
  t.boolean({
    resolve: async (_root, _args, ctx) => {
      const user = ctx.user;
      if (!user)
        throw new GraphQLError('Unauthorized', { extensions: { code: ERROR_CODES.UNAUTHORIZED } });
      if (!user.sid)
        throw new GraphQLError('No active session', {
          extensions: { code: ERROR_CODES.UNAUTHORIZED },
        });
      const { sessionResolver } = ctx.diScope.cradle;
      return sessionResolver.revokeOtherSessions(user.sub, user.sid);
    },
  }),
);
