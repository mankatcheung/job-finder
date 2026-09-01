import { GraphQLError } from 'graphql';
import { builder } from '#src/http/schema/builder.js';
import { EducationRef } from '#src/http/schema/types/EducationType.js';
import {
  CreateEducationInput,
  UpdateEducationInput,
} from '#src/http/schema/types/inputs/EducationInputs.js';
import { ERROR_CODES } from '#src/use-cases/errors/errorCodes.js';

builder.mutationField('createEducation', (t) =>
  t.field({
    type: EducationRef,
    args: {
      input: t.arg({ type: CreateEducationInput, required: true }),
    },
    resolve: async (_root, args, ctx) => {
      if (!ctx.user)
        throw new GraphQLError('Unauthorized', { extensions: { code: ERROR_CODES.UNAUTHORIZED } });
      const { educationResolver } = ctx.diScope.cradle;
      return educationResolver.createEducation(ctx.user.sub, {
        institution: args.input.institution,
        degree: args.input.degree ?? undefined,
        field: args.input.field ?? undefined,
        startDate: args.input.startDate,
        endDate: args.input.endDate ?? undefined,
        description: args.input.description ?? undefined,
      });
    },
  }),
);

builder.mutationField('updateEducation', (t) =>
  t.field({
    type: EducationRef,
    args: {
      id: t.arg.id({ required: true }),
      input: t.arg({ type: UpdateEducationInput, required: true }),
    },
    resolve: async (_root, args, ctx) => {
      if (!ctx.user)
        throw new GraphQLError('Unauthorized', { extensions: { code: ERROR_CODES.UNAUTHORIZED } });
      const { educationResolver } = ctx.diScope.cradle;
      return educationResolver.updateEducation(ctx.user.sub, args.id, {
        institution: args.input.institution ?? undefined,
        degree: args.input.degree,
        field: args.input.field,
        startDate: args.input.startDate ?? undefined,
        endDate: args.input.endDate,
        description: args.input.description,
      });
    },
  }),
);

builder.mutationField('deleteEducation', (t) =>
  t.field({
    type: 'Boolean',
    args: {
      id: t.arg.id({ required: true }),
    },
    resolve: async (_root, args, ctx) => {
      if (!ctx.user)
        throw new GraphQLError('Unauthorized', { extensions: { code: ERROR_CODES.UNAUTHORIZED } });
      const { educationResolver } = ctx.diScope.cradle;
      await educationResolver.deleteEducation(ctx.user.sub, args.id);
      return true;
    },
  }),
);
