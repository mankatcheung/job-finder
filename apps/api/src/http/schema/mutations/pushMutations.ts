import { builder } from '#src/http/schema/builder.js';
import { GraphQLError } from 'graphql';
import { ERROR_CODES } from '#src/use-cases/errors/errorCodes.js';
import { fromCodedError } from '#src/http/errors/AppError.js';

builder.mutationField('registerPushSubscription', (t) =>
  t.boolean({
    args: {
      endpoint: t.arg.string({ required: true }),
      p256dh: t.arg.string({ required: true }),
      auth: t.arg.string({ required: true }),
    },
    resolve: async (_root, args, ctx) => {
      if (!ctx.user)
        throw new GraphQLError('Unauthorized', { extensions: { code: ERROR_CODES.UNAUTHORIZED } });
      const { registerPushSubscriptionUseCase } = ctx.diScope.cradle;
      try {
        await registerPushSubscriptionUseCase.execute({
          userId: ctx.user.sub,
          endpoint: args.endpoint,
          p256dh: args.p256dh,
          auth: args.auth,
        });
        return true;
      } catch (err) {
        throw fromCodedError(err);
      }
    },
  }),
);

builder.mutationField('registerExpoPushToken', (t) =>
  t.boolean({
    args: {
      token: t.arg.string({ required: true }),
    },
    resolve: async (_root, args, ctx) => {
      if (!ctx.user)
        throw new GraphQLError('Unauthorized', { extensions: { code: ERROR_CODES.UNAUTHORIZED } });
      const { registerExpoPushTokenUseCase } = ctx.diScope.cradle;
      try {
        await registerExpoPushTokenUseCase.execute({
          userId: ctx.user.sub,
          token: args.token,
        });
        return true;
      } catch (err) {
        throw fromCodedError(err);
      }
    },
  }),
);

// Mobile reuses this mutation as-is to unregister an Expo push token: it
// deletes by endpoint regardless of provider, and an Expo token is stored
// as the endpoint (see RegisterExpoPushTokenUseCase).
builder.mutationField('unregisterPushSubscription', (t) =>
  t.boolean({
    args: {
      endpoint: t.arg.string({ required: true }),
    },
    resolve: async (_root, args, ctx) => {
      if (!ctx.user)
        throw new GraphQLError('Unauthorized', { extensions: { code: ERROR_CODES.UNAUTHORIZED } });
      const { unregisterPushSubscriptionUseCase } = ctx.diScope.cradle;
      try {
        await unregisterPushSubscriptionUseCase.execute({ endpoint: args.endpoint });
        return true;
      } catch (err) {
        throw fromCodedError(err);
      }
    },
  }),
);
