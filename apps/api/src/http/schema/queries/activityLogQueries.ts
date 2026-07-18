import { builder } from '@/http/schema/builder.js';
import { ActivityLogRef } from '@/http/schema/types/ActivityLogType.js';

builder.queryField('activityLogs', (t) =>
  t.field({
    type: [ActivityLogRef],
    args: {
      applicationId: t.arg.id({ required: true }),
    },
    resolve: (_root, args, ctx) => ctx.diScope.resolve('activityLogResolver').getActivityLogs(String(args.applicationId), ctx),
  }),
);
