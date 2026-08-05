import { GraphQLError } from 'graphql';
import { builder } from '#src/http/schema/builder.js';
import { ERROR_CODES } from '#src/constants.js';
import { PipelineStageRef } from '#src/http/schema/types/PipelineStageType.js';

builder.queryField('pipelineStages', (t) =>
  t.field({
    type: [PipelineStageRef],
    resolve: async (_root, _args, ctx) => {
      if (!ctx.user)
        throw new GraphQLError('Unauthorized', { extensions: { code: ERROR_CODES.UNAUTHORIZED } });
      return ctx.diScope.cradle.pipelineStageResolver.getStages(ctx.user.sub);
    },
  }),
);
