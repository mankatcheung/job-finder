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
      const { listSessionsUseCase, sessionMapper } = ctx.diScope.cradle;
      const sessions = await listSessionsUseCase.execute(user.sub);
      return sessions.map((session) => sessionMapper.toDTO(session, user.sid));
    },
  }),
);
