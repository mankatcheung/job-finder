import { GraphQLError } from 'graphql';
import { builder } from '#src/http/schema/builder.js';
import { WorkExperienceRef } from '#src/http/schema/types/WorkExperienceType.js';
import { ERROR_CODES } from '#src/use-cases/errors/errorCodes.js';

builder.queryField('workExperiences', (t) =>
  t.field({
    type: [WorkExperienceRef],
    resolve: async (_root, _args, ctx) => {
      if (!ctx.user)
        throw new GraphQLError('Unauthorized', { extensions: { code: ERROR_CODES.UNAUTHORIZED } });
      const { workExperienceResolver } = ctx.diScope.cradle;
      return workExperienceResolver.getWorkExperiences(ctx.user.sub);
    },
  }),
);
