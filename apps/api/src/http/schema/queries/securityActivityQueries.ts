import { GraphQLError } from 'graphql';
import { builder } from '#src/http/schema/builder.js';
import { SecurityActivityItemRef } from '#src/http/schema/types/SecurityActivityType.js';
import { ERROR_CODES } from '#src/use-cases/errors/errorCodes.js';

builder.queryField('securityActivity', (t) =>
  t.field({
    type: [SecurityActivityItemRef],
    resolve: (_root, _args, ctx) => {
      if (!ctx.user)
        throw new GraphQLError('Unauthorized', { extensions: { code: ERROR_CODES.UNAUTHORIZED } });
      return ctx.diScope.resolve('securityActivityResolver').getSecurityActivity(ctx.user.sub);
    },
  }),
);
