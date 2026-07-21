import { GraphQLError } from 'graphql';
import { builder } from '@/http/schema/builder.js';
import { HealthScoreRef } from '@/http/schema/types/HealthScoreType.js';
import { ERROR_CODES } from '@/constants.js';

builder.queryField('applicationHealthScore', (t) =>
  t.field({
    type: HealthScoreRef,
    args: {
      applicationId: t.arg.id({ required: true }),
    },
    resolve: async (_root, args, ctx) => {
      if (!ctx.user)
        throw new GraphQLError('Unauthorized', { extensions: { code: ERROR_CODES.UNAUTHORIZED } });
      const { computeHealthScoreUseCase } = ctx.diScope.cradle;
      return computeHealthScoreUseCase.execute(args.applicationId, ctx.user.sub);
    },
  }),
);
