import { GraphQLError } from 'graphql';
import { builder } from '#src/http/schema/builder.js';
import { SkillRef } from '#src/http/schema/types/SkillType.js';
import { ERROR_CODES } from '#src/use-cases/errors/errorCodes.js';

builder.queryField('skills', (t) =>
  t.field({
    type: [SkillRef],
    resolve: async (_root, _args, ctx) => {
      if (!ctx.user)
        throw new GraphQLError('Unauthorized', { extensions: { code: ERROR_CODES.UNAUTHORIZED } });
      const { skillResolver } = ctx.diScope.cradle;
      return skillResolver.getSkills(ctx.user.sub);
    },
  }),
);
