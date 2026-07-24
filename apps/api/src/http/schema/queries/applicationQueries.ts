import { GraphQLError } from 'graphql';
import { builder } from '@/http/schema/builder.js';
import { JobApplicationRef } from '@/http/schema/types/ApplicationType.js';
import { ApplicationConnectionRef } from '@/http/schema/types/ApplicationConnectionType.js';
import { ApplicationStatusEnum } from '@/http/schema/types/enums/ApplicationStatusEnum.js';
import type { ApplicationStatus } from '@/domain/application/ApplicationStatus.js';
import { ERROR_CODES } from '@/constants.js';

builder.queryField('applications', (t) =>
  t.field({
    type: [JobApplicationRef],
    args: {
      status: t.arg({ type: ApplicationStatusEnum, required: false }),
    },
    resolve: async (_root, args, ctx) => {
      if (!ctx.user)
        throw new GraphQLError('Unauthorized', { extensions: { code: ERROR_CODES.UNAUTHORIZED } });
      const { applicationResolver } = ctx.diScope.cradle;
      return applicationResolver.getApplications(
        ctx.user.sub,
        args.status as ApplicationStatus | undefined,
      );
    },
  }),
);

builder.queryField('applicationsPage', (t) =>
  t.field({
    type: ApplicationConnectionRef,
    args: {
      status: t.arg({ type: ApplicationStatusEnum, required: false }),
      starred: t.arg.boolean({ required: false }),
      search: t.arg.string({ required: false }),
      cursor: t.arg.string({ required: false }),
      limit: t.arg.int({ required: false }),
    },
    resolve: async (_root, args, ctx) => {
      if (!ctx.user)
        throw new GraphQLError('Unauthorized', { extensions: { code: ERROR_CODES.UNAUTHORIZED } });
      const { applicationResolver } = ctx.diScope.cradle;
      return applicationResolver.getApplicationsPage(ctx.user.sub, {
        status: (args.status as ApplicationStatus) ?? undefined,
        starred: args.starred ?? undefined,
        search: args.search ?? undefined,
        cursor: args.cursor ?? undefined,
        limit: args.limit ?? undefined,
      });
    },
  }),
);

builder.queryField('application', (t) =>
  t.field({
    type: JobApplicationRef,
    args: {
      id: t.arg.id({ required: true }),
    },
    resolve: async (_root, args, ctx) => {
      if (!ctx.user)
        throw new GraphQLError('Unauthorized', { extensions: { code: ERROR_CODES.UNAUTHORIZED } });
      const { applicationResolver } = ctx.diScope.cradle;
      return applicationResolver.getApplication(ctx.user.sub, args.id);
    },
  }),
);
