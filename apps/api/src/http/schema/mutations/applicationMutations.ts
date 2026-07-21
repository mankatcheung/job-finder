import { GraphQLError } from 'graphql';
import { builder } from '@/http/schema/builder.js';
import { JobApplicationRef } from '@/http/schema/types/ApplicationType.js';
import {
  CreateApplicationInput,
  UpdateApplicationInput,
} from '@/http/schema/types/inputs/ApplicationInputs.js';
import type { ApplicationStatus } from '@/domain/application/ApplicationStatus.js';
import { ERROR_CODES } from '@/constants.js';

builder.mutationField('createApplication', (t) =>
  t.field({
    type: JobApplicationRef,
    args: {
      input: t.arg({ type: CreateApplicationInput, required: true }),
    },
    resolve: async (_root, args, ctx) => {
      if (!ctx.user)
        throw new GraphQLError('Unauthorized', { extensions: { code: ERROR_CODES.UNAUTHORIZED } });
      const { applicationResolver } = ctx.diScope.cradle;
      return applicationResolver.createApplication(ctx.user.sub, {
        company: args.input.company,
        role: args.input.role,
        status: (args.input.status as ApplicationStatus) ?? undefined,
        jobUrl: args.input.jobUrl ?? undefined,
        location: args.input.location ?? undefined,
        salaryRange: args.input.salaryRange ?? undefined,
        description: args.input.description ?? undefined,
        starred: args.input.starred ?? undefined,
        source: args.input.source ?? undefined,
        followUpAt: args.input.followUpAt ? new Date(args.input.followUpAt) : undefined,
        tags: args.input.tags ?? undefined,
      });
    },
  }),
);

builder.mutationField('updateApplication', (t) =>
  t.field({
    type: JobApplicationRef,
    args: {
      id: t.arg.id({ required: true }),
      input: t.arg({ type: UpdateApplicationInput, required: true }),
    },
    resolve: async (_root, args, ctx) => {
      if (!ctx.user)
        throw new GraphQLError('Unauthorized', { extensions: { code: ERROR_CODES.UNAUTHORIZED } });
      const { applicationResolver } = ctx.diScope.cradle;
      return applicationResolver.updateApplication(ctx.user.sub, args.id, {
        company: args.input.company ?? undefined,
        role: args.input.role ?? undefined,
        status: (args.input.status as ApplicationStatus) ?? undefined,
        jobUrl: args.input.jobUrl,
        location: args.input.location,
        salaryRange: args.input.salaryRange,
        description: args.input.description,
        starred: args.input.starred ?? undefined,
        source: args.input.source,
        tags: args.input.tags ?? undefined,
        followUpAt:
          args.input.followUpAt !== undefined
            ? args.input.followUpAt
              ? new Date(args.input.followUpAt)
              : null
            : undefined,
      });
    },
  }),
);

builder.mutationField('deleteApplication', (t) =>
  t.field({
    type: 'Boolean',
    args: {
      id: t.arg.id({ required: true }),
    },
    resolve: async (_root, args, ctx) => {
      if (!ctx.user)
        throw new GraphQLError('Unauthorized', { extensions: { code: ERROR_CODES.UNAUTHORIZED } });
      const { applicationResolver } = ctx.diScope.cradle;
      return applicationResolver.deleteApplication(ctx.user.sub, args.id);
    },
  }),
);
