import { GraphQLError } from 'graphql';
import { builder } from '@/http/schema/builder.js';
import { JobApplicationRef } from '@/http/schema/types/ApplicationType.js';
import { ApplicationStatusEnum } from '@/http/schema/types/enums/ApplicationStatusEnum.js';
import type { ApplicationStatus } from '@/domain/application/ApplicationStatus.js';

builder.queryField('applications', (t) =>
  t.field({
    type: [JobApplicationRef],
    args: {
      status: t.arg({ type: ApplicationStatusEnum, required: false }),
    },
    resolve: async (_root, args, ctx) => {
      if (!ctx.user)
        throw new GraphQLError('Unauthorized', { extensions: { code: 'UNAUTHORIZED' } });
      const { applicationResolver } = ctx.diScope.cradle;
      return applicationResolver.getApplications(
        ctx.user.sub,
        args.status as ApplicationStatus | undefined,
      );
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
        throw new GraphQLError('Unauthorized', { extensions: { code: 'UNAUTHORIZED' } });
      const { applicationResolver } = ctx.diScope.cradle;
      return applicationResolver.getApplication(ctx.user.sub, args.id);
    },
  }),
);
