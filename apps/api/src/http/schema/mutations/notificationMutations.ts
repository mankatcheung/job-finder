import { GraphQLError } from 'graphql';
import { builder } from '#src/http/schema/builder.js';
import { fromCodedError } from '#src/http/errors/AppError.js';
import { ERROR_CODES } from '#src/use-cases/errors/errorCodes.js';

builder.mutationField('markNotificationsRead', (t) =>
  t.boolean({
    args: {
      ids: t.arg.idList({ required: true }),
      isRead: t.arg.boolean({ required: true }),
    },
    resolve: async (_root, args, ctx) => {
      if (!ctx.user)
        throw new GraphQLError('Unauthorized', { extensions: { code: ERROR_CODES.UNAUTHORIZED } });
      const { notificationResolver } = ctx.diScope.cradle;
      try {
        return await notificationResolver.markNotificationsRead(
          ctx.user.sub,
          args.ids as string[],
          args.isRead,
        );
      } catch (err) {
        throw fromCodedError(err);
      }
    },
  }),
);
