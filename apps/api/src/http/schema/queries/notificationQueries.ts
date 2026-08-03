import { GraphQLError } from 'graphql';
import { builder } from '#src/http/schema/builder.js';
import { NotificationConnectionRef } from '#src/http/schema/types/NotificationConnectionType.js';
import { ERROR_CODES } from '#src/constants.js';

builder.queryField('notificationsPage', (t) =>
  t.field({
    type: NotificationConnectionRef,
    args: {
      cursor: t.arg.string({ required: false }),
      limit: t.arg.int({ required: false }),
    },
    resolve: async (_root, args, ctx) => {
      if (!ctx.user)
        throw new GraphQLError('Unauthorized', { extensions: { code: ERROR_CODES.UNAUTHORIZED } });
      const { notificationResolver } = ctx.diScope.cradle;
      return notificationResolver.getNotificationsPage(ctx.user.sub, {
        cursor: args.cursor ?? undefined,
        limit: args.limit ?? undefined,
      });
    },
  }),
);

builder.queryField('unreadNotificationCount', (t) =>
  t.int({
    resolve: async (_root, _args, ctx) => {
      if (!ctx.user)
        throw new GraphQLError('Unauthorized', { extensions: { code: ERROR_CODES.UNAUTHORIZED } });
      const { notificationResolver } = ctx.diScope.cradle;
      return notificationResolver.getUnreadNotificationCount(ctx.user.sub);
    },
  }),
);
