import { GraphQLError } from 'graphql';
import { builder } from '#src/http/schema/builder.js';
import { SkillRef } from '#src/http/schema/types/SkillType.js';
import { CreateSkillInput, UpdateSkillInput } from '#src/http/schema/types/inputs/SkillInputs.js';
import { ERROR_CODES } from '#src/use-cases/errors/errorCodes.js';

builder.mutationField('createSkill', (t) =>
  t.field({
    type: SkillRef,
    args: {
      input: t.arg({ type: CreateSkillInput, required: true }),
    },
    resolve: async (_root, args, ctx) => {
      if (!ctx.user)
        throw new GraphQLError('Unauthorized', { extensions: { code: ERROR_CODES.UNAUTHORIZED } });
      const { skillResolver } = ctx.diScope.cradle;
      return skillResolver.createSkill(ctx.user.sub, {
        name: args.input.name,
        category: args.input.category ?? undefined,
        proficiency: args.input.proficiency ?? undefined,
      });
    },
  }),
);

builder.mutationField('updateSkill', (t) =>
  t.field({
    type: SkillRef,
    args: {
      id: t.arg.id({ required: true }),
      input: t.arg({ type: UpdateSkillInput, required: true }),
    },
    resolve: async (_root, args, ctx) => {
      if (!ctx.user)
        throw new GraphQLError('Unauthorized', { extensions: { code: ERROR_CODES.UNAUTHORIZED } });
      const { skillResolver } = ctx.diScope.cradle;
      return skillResolver.updateSkill(ctx.user.sub, args.id, {
        name: args.input.name ?? undefined,
        category: args.input.category,
        proficiency: args.input.proficiency,
      });
    },
  }),
);

builder.mutationField('deleteSkill', (t) =>
  t.field({
    type: 'Boolean',
    args: {
      id: t.arg.id({ required: true }),
    },
    resolve: async (_root, args, ctx) => {
      if (!ctx.user)
        throw new GraphQLError('Unauthorized', { extensions: { code: ERROR_CODES.UNAUTHORIZED } });
      const { skillResolver } = ctx.diScope.cradle;
      await skillResolver.deleteSkill(ctx.user.sub, args.id);
      return true;
    },
  }),
);
