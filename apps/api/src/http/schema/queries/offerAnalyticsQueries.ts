import { GraphQLError } from 'graphql';
import { builder } from '#src/http/schema/builder.js';
import { OfferAnalyticsRef } from '#src/http/schema/types/OfferAnalyticsType.js';
import { ERROR_CODES } from '#src/constants.js';

builder.queryField('offerAnalytics', (t) =>
  t.field({
    type: OfferAnalyticsRef,
    resolve: async (_root, _args, ctx) => {
      if (!ctx.user)
        throw new GraphQLError('Unauthorized', { extensions: { code: ERROR_CODES.UNAUTHORIZED } });
      const { getOfferAnalyticsUseCase } = ctx.diScope.cradle;
      return getOfferAnalyticsUseCase.execute({ userId: ctx.user.sub });
    },
  }),
);
