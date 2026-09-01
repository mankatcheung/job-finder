import { GraphQLError } from 'graphql';
import { builder } from '#src/http/schema/builder.js';
import { ApplicationChannelAnalyticsRef } from '#src/http/schema/types/ApplicationChannelAnalyticsType.js';
import { ERROR_CODES } from '#src/use-cases/errors/errorCodes.js';

builder.queryField('applicationChannelAnalytics', (t) =>
  t.field({
    type: ApplicationChannelAnalyticsRef,
    resolve: async (_root, _args, ctx) => {
      if (!ctx.user)
        throw new GraphQLError('Unauthorized', { extensions: { code: ERROR_CODES.UNAUTHORIZED } });
      const { getApplicationChannelAnalyticsUseCase } = ctx.diScope.cradle;
      return getApplicationChannelAnalyticsUseCase.execute({ userId: ctx.user.sub });
    },
  }),
);
