import { GraphQLError } from 'graphql';
import { builder } from '@/http/schema/builder.js';
import { ERROR_CODES } from '@/constants.js';

builder.mutationField('generateCoverLetter', (t) =>
  t.field({
    type: 'String',
    args: {
      applicationId: t.arg.id({ required: true }),
      resumeText: t.arg.string({ required: false }),
    },
    resolve: async (_root, args, ctx) => {
      if (!ctx.user)
        throw new GraphQLError('Unauthorized', { extensions: { code: ERROR_CODES.UNAUTHORIZED } });
      const { generateCoverLetterUseCase } = ctx.diScope.cradle;
      try {
        return await generateCoverLetterUseCase.execute({
          applicationId: args.applicationId,
          userId: ctx.user.sub,
          resumeText: args.resumeText,
        });
      } catch (err) {
        throw new GraphQLError((err as Error).message ?? 'Failed to generate cover letter');
      }
    },
  }),
);
