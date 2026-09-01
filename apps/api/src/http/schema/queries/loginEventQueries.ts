import { GraphQLError } from 'graphql';
import { builder } from '#src/http/schema/builder.js';
import { LoginEventRef } from '#src/http/schema/types/LoginEventType.js';
import { ERROR_CODES } from '#src/use-cases/errors/errorCodes.js';

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
