import { GraphQLError } from 'graphql';
import { builder } from '@/http/schema/builder.js';
import { ERROR_CODES } from '@/constants.js';

builder.queryField('exportUserData', (t) =>
  t.string({
    resolve: async (_root, _args, ctx) => {
      if (!ctx.user)
        throw new GraphQLError('Unauthorized', { extensions: { code: ERROR_CODES.UNAUTHORIZED } });
      const { userResolver } = ctx.diScope.cradle;
      const data = await userResolver.exportUserData(ctx.user.sub);
      return JSON.stringify(data, null, 2);
    },
  }),
);
