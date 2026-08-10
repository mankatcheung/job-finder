import { GraphQLError } from 'graphql';
import { builder } from '#src/http/schema/builder.js';
import { InterviewRoundAnalyticsRef } from '#src/http/schema/types/InterviewRoundAnalyticsType.js';
import { ERROR_CODES } from '#src/constants.js';

builder.queryField('interviewRoundAnalytics', (t) =>
  t.field({
    type: InterviewRoundAnalyticsRef,
    resolve: async (_root, _args, ctx) => {
      if (!ctx.user)
        throw new GraphQLError('Unauthorized', { extensions: { code: ERROR_CODES.UNAUTHORIZED } });
      const { getInterviewRoundAnalyticsUseCase } = ctx.diScope.cradle;
      return getInterviewRoundAnalyticsUseCase.execute({ userId: ctx.user.sub });
    },
  }),
);
