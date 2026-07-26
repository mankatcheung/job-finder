import { GraphQLError } from 'graphql';
import { builder } from '#src/http/schema/builder.js';
import { InterviewRoundRef } from '#src/http/schema/types/InterviewRoundType.js';
import { ERROR_CODES } from '#src/constants.js';

builder.queryField('interviewRounds', (t) =>
  t.field({
    type: [InterviewRoundRef],
    args: {
      applicationId: t.arg.id({ required: true }),
    },
    resolve: async (_root, args, ctx) => {
      if (!ctx.user)
        throw new GraphQLError('Unauthorized', { extensions: { code: ERROR_CODES.UNAUTHORIZED } });
      const { interviewRoundResolver } = ctx.diScope.cradle;
      return interviewRoundResolver.getInterviewRounds(ctx.user.sub, args.applicationId);
    },
  }),
);
