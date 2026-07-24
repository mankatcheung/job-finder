import { GraphQLError } from 'graphql';
import { builder } from '@/http/schema/builder.js';
import { SessionRef } from '@/http/schema/types/SessionType.js';
import { ERROR_CODES } from '@/constants.js';

builder.queryField('sessions', (t) =>
  t.field({
    type: [SessionRef],
    resolve: async (_root, _args, ctx) => {
      const user = ctx.user;
      if (!user)
        throw new GraphQLError('Unauthorized', { extensions: { code: ERROR_CODES.UNAUTHORIZED } });
      const { sessionResolver } = ctx.diScope.cradle;
      return sessionResolver.listSessions(user.sub, user.sid);
    },
  }),
);
