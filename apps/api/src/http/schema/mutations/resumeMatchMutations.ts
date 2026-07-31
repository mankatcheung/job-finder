import { GraphQLError } from 'graphql';
import { builder } from '#src/http/schema/builder.js';
import { ResumeMatchScoreRef } from '#src/http/schema/types/ResumeMatchScoreType.js';
import { fromCodedError } from '#src/http/errors/AppError.js';
import { ERROR_CODES } from '#src/constants.js';

builder.mutationField('computeResumeMatchScore', (t) =>
  t.field({
    type: ResumeMatchScoreRef,
    args: {
      applicationId: t.arg.id({ required: true }),
      resumeText: t.arg.string({ required: false }),
    },
    resolve: async (_root, args, ctx) => {
      if (!ctx.user)
        throw new GraphQLError('Unauthorized', { extensions: { code: ERROR_CODES.UNAUTHORIZED } });
      const { computeResumeMatchScoreUseCase } = ctx.diScope.cradle;
      try {
        return await computeResumeMatchScoreUseCase.execute({
          applicationId: args.applicationId,
          userId: ctx.user.sub,
          resumeText: args.resumeText,
        });
      } catch (err) {
        throw fromCodedError(err);
      }
    },
  }),
);
