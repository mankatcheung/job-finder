import { GraphQLError } from 'graphql';
import { builder } from '#src/http/schema/builder.js';
import { WorkExperienceRef } from '#src/http/schema/types/WorkExperienceType.js';
import {
  CreateWorkExperienceInput,
  UpdateWorkExperienceInput,
} from '#src/http/schema/types/inputs/WorkExperienceInputs.js';
import { ERROR_CODES } from '#src/use-cases/errors/errorCodes.js';

builder.mutationField('createWorkExperience', (t) =>
  t.field({
    type: WorkExperienceRef,
    args: {
      input: t.arg({ type: CreateWorkExperienceInput, required: true }),
    },
    resolve: async (_root, args, ctx) => {
      if (!ctx.user)
        throw new GraphQLError('Unauthorized', { extensions: { code: ERROR_CODES.UNAUTHORIZED } });
      const { workExperienceResolver } = ctx.diScope.cradle;
      return workExperienceResolver.createWorkExperience(ctx.user.sub, {
        company: args.input.company,
        title: args.input.title,
        location: args.input.location ?? undefined,
        startDate: args.input.startDate,
        endDate: args.input.endDate ?? undefined,
        description: args.input.description ?? undefined,
      });
    },
  }),
);

builder.mutationField('updateWorkExperience', (t) =>
  t.field({
    type: WorkExperienceRef,
    args: {
      id: t.arg.id({ required: true }),
      input: t.arg({ type: UpdateWorkExperienceInput, required: true }),
    },
    resolve: async (_root, args, ctx) => {
      if (!ctx.user)
        throw new GraphQLError('Unauthorized', { extensions: { code: ERROR_CODES.UNAUTHORIZED } });
      const { workExperienceResolver } = ctx.diScope.cradle;
      return workExperienceResolver.updateWorkExperience(ctx.user.sub, args.id, {
        company: args.input.company ?? undefined,
        title: args.input.title ?? undefined,
        location: args.input.location,
        startDate: args.input.startDate ?? undefined,
        endDate: args.input.endDate,
        description: args.input.description,
      });
    },
  }),
);

builder.mutationField('deleteWorkExperience', (t) =>
  t.field({
    type: 'Boolean',
    args: {
      id: t.arg.id({ required: true }),
    },
    resolve: async (_root, args, ctx) => {
      if (!ctx.user)
        throw new GraphQLError('Unauthorized', { extensions: { code: ERROR_CODES.UNAUTHORIZED } });
      const { workExperienceResolver } = ctx.diScope.cradle;
      await workExperienceResolver.deleteWorkExperience(ctx.user.sub, args.id);
      return true;
    },
  }),
);
