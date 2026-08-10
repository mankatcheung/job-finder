import { GraphQLError } from 'graphql';
import { builder } from '#src/http/schema/builder.js';
import { ResponseTimeAnalyticsRef } from '#src/http/schema/types/ResponseTimeAnalyticsType.js';
import { ERROR_CODES } from '#src/constants.js';

builder.queryField('responseTimeAnalytics', (t) =>
  t.field({
    type: ResponseTimeAnalyticsRef,
    resolve: async (_root, _args, ctx) => {
      if (!ctx.user)
        throw new GraphQLError('Unauthorized', { extensions: { code: ERROR_CODES.UNAUTHORIZED } });
      const { getResponseTimeAnalyticsUseCase } = ctx.diScope.cradle;
      return getResponseTimeAnalyticsUseCase.execute({ userId: ctx.user.sub });
    },
  }),
);
