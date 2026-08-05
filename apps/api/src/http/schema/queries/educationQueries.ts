import { GraphQLError } from 'graphql';
import { builder } from '#src/http/schema/builder.js';
import { EducationRef } from '#src/http/schema/types/EducationType.js';
import { ERROR_CODES } from '#src/constants.js';

builder.queryField('educations', (t) =>
  t.field({
    type: [EducationRef],
    resolve: async (_root, _args, ctx) => {
      if (!ctx.user)
        throw new GraphQLError('Unauthorized', { extensions: { code: ERROR_CODES.UNAUTHORIZED } });
      const { educationResolver } = ctx.diScope.cradle;
      return educationResolver.getEducations(ctx.user.sub);
    },
  }),
);
