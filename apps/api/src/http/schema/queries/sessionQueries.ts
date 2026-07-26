import { GraphQLError } from 'graphql';
import { builder } from '#src/http/schema/builder.js';
import { SessionRef } from '#src/http/schema/types/SessionType.js';
import { ERROR_CODES } from '#src/constants.js';

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
