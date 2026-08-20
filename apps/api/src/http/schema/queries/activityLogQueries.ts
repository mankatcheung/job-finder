import { GraphQLError } from 'graphql';
import { builder } from '#src/http/schema/builder.js';
import { ActivityLogRef } from '#src/http/schema/types/ActivityLogType.js';
import { ERROR_CODES } from '#src/constants.js';

builder.queryField('activityLogs', (t) =>
  t.field({
    type: [ActivityLogRef],
    args: {
      applicationId: t.arg.id({ required: true }),
    },
    resolve: async (_root, args, ctx) => {
      if (!ctx.user)
        throw new GraphQLError('Unauthorized', { extensions: { code: ERROR_CODES.UNAUTHORIZED } });
      const { activityLogResolver } = ctx.diScope.cradle;
      return activityLogResolver.getActivityLogs(ctx.user.sub, String(args.applicationId));
    },
  }),
);
