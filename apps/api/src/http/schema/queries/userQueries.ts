import { GraphQLError } from 'graphql';
import { builder } from '#src/http/schema/builder.js';
import { NotificationPreferencesRef } from '#src/http/schema/types/NotificationPreferencesType.js';
import { UserRef } from '#src/http/schema/types/UserType.js';
import { ERROR_CODES } from '#src/constants.js';

builder.queryField('exportUserData', (t) =>
  t.string({
    resolve: async (_root, _args, ctx) => {
      if (!ctx.user)
        throw new GraphQLError('Unauthorized', { extensions: { code: ERROR_CODES.UNAUTHORIZED } });
      const { userResolver } = ctx.diScope.cradle;
      const data = await userResolver.exportUserData(ctx.user.sub);
      return JSON.stringify(data, null, 2);
    },
  }),
);

builder.queryField('totpEnabled', (t) =>
  t.boolean({
    resolve: async (_root, _args, ctx) => {
      if (!ctx.user)
        throw new GraphQLError('Unauthorized', { extensions: { code: ERROR_CODES.UNAUTHORIZED } });
      const { userResolver } = ctx.diScope.cradle;
      return userResolver.getTotpStatus(ctx.user.sub);
    },
  }),
);

builder.queryField('notificationPreferences', (t) =>
  t.field({
    type: NotificationPreferencesRef,
    resolve: async (_root, _args, ctx) => {
      if (!ctx.user)
        throw new GraphQLError('Unauthorized', { extensions: { code: ERROR_CODES.UNAUTHORIZED } });
      const { userResolver } = ctx.diScope.cradle;
      return userResolver.getNotificationPreferences(ctx.user.sub);
    },
  }),
);

builder.queryField('me', (t) =>
  t.field({
    type: UserRef,
    nullable: true,
    resolve: async (_root, _args, ctx) => {
      if (!ctx.user)
        throw new GraphQLError('Unauthorized', { extensions: { code: ERROR_CODES.UNAUTHORIZED } });
      const { userResolver } = ctx.diScope.cradle;
      return userResolver.getMe(ctx.user.sub);
    },
  }),
);
