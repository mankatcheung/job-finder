import { GraphQLError } from 'graphql';
import { builder } from '@/http/schema/builder.js';
import { LoginEventRef } from '@/http/schema/types/LoginEventType.js';
import { ERROR_CODES } from '@/constants.js';

builder.queryField('loginHistory', (t) =>
  t.field({
    type: [LoginEventRef],
    resolve: (_root, _args, ctx) => {
      if (!ctx.user)
        throw new GraphQLError('Unauthorized', { extensions: { code: ERROR_CODES.UNAUTHORIZED } });
      return ctx.diScope.resolve('loginEventResolver').getLoginHistory(ctx.user.sub);
    },
  }),
);
