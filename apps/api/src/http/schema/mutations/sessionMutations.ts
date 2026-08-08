import { GraphQLError } from 'graphql';
import { builder } from '#src/http/schema/builder.js';
import { deviceInfoFrom } from '#src/http/schema/requestDeviceInfo.js';
import { ERROR_CODES } from '#src/constants.js';

builder.mutationField('revokeSession', (t) =>
  t.boolean({
    args: {
      id: t.arg.id({ required: true }),
    },
    resolve: async (_root, args, ctx) => {
      if (!ctx.user)
        throw new GraphQLError('Unauthorized', { extensions: { code: ERROR_CODES.UNAUTHORIZED } });
      const { sessionResolver } = ctx.diScope.cradle;
      const device = deviceInfoFrom(ctx.request);
      return sessionResolver.revokeSession(
        ctx.user.sub,
        String(args.id),
        device.ipAddress,
        device.userAgent,
      );
    },
  }),
);

builder.mutationField('revokeOtherSessions', (t) =>
  t.boolean({
    resolve: async (_root, _args, ctx) => {
      const user = ctx.user;
      if (!user)
        throw new GraphQLError('Unauthorized', { extensions: { code: ERROR_CODES.UNAUTHORIZED } });
      if (!user.sid)
        throw new GraphQLError('No active session', {
          extensions: { code: ERROR_CODES.UNAUTHORIZED },
        });
      const { sessionResolver } = ctx.diScope.cradle;
      const device = deviceInfoFrom(ctx.request);
      return sessionResolver.revokeOtherSessions(
        user.sub,
        user.sid,
        device.ipAddress,
        device.userAgent,
      );
    },
  }),
);
