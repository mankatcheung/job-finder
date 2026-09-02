/**
 * Enrolling, disabling and recovering TOTP two-factor authentication.
 *
 * One of the per-concern modules split out of the former 498-line
 * `userMutations.ts` (JEF-255); `userMutations.ts` still registers them all.
 */

import { ConfirmTotpSetupResultRef } from '#src/http/schema/types/ConfirmTotpSetupType.js';
import { ERROR_CODES } from '#src/use-cases/errors/errorCodes.js';
import { GraphQLError } from 'graphql';
import { TotpSetupRef } from '#src/http/schema/types/TotpSetupType.js';
import { builder } from '#src/http/schema/builder.js';
import { deviceInfoFrom } from '#src/http/schema/requestDeviceInfo.js';
import { fromCodedError } from '#src/http/errors/AppError.js';
import { sessionAuthTime } from '#src/http/schema/mutations/user/sessionAuthTime.js';

builder.mutationField('beginTotpSetup', (t) =>
  t.field({
    type: TotpSetupRef,
    args: {
      password: t.arg.string({ required: true }),
    },
    resolve: async (_root, args, ctx) => {
      if (!ctx.user)
        throw new GraphQLError('Unauthorized', { extensions: { code: ERROR_CODES.UNAUTHORIZED } });
      const { userResolver } = ctx.diScope.cradle;
      try {
        return await userResolver.beginTotpSetup(ctx.user.sub, args.password);
      } catch (err) {
        throw fromCodedError(err);
      }
    },
  }),
);

builder.mutationField('confirmTotpSetup', (t) =>
  t.field({
    type: ConfirmTotpSetupResultRef,
    args: {
      code: t.arg.string({ required: true }),
    },
    resolve: async (_root, args, ctx) => {
      if (!ctx.user)
        throw new GraphQLError('Unauthorized', { extensions: { code: ERROR_CODES.UNAUTHORIZED } });
      const { userResolver } = ctx.diScope.cradle;
      try {
        return await userResolver.confirmTotpSetup(
          ctx.user.sub,
          args.code,
          deviceInfoFrom(ctx.request),
        );
      } catch (err) {
        throw fromCodedError(err);
      }
    },
  }),
);

builder.mutationField('disableTotp', (t) =>
  t.boolean({
    args: {
      password: t.arg.string({ required: true }),
    },
    resolve: async (_root, args, ctx) => {
      if (!ctx.user)
        throw new GraphQLError('Unauthorized', { extensions: { code: ERROR_CODES.UNAUTHORIZED } });
      const { userResolver } = ctx.diScope.cradle;
      try {
        await userResolver.disableTotp(ctx.user.sub, args.password, deviceInfoFrom(ctx.request));
        return true;
      } catch (err) {
        throw fromCodedError(err);
      }
    },
  }),
);

builder.mutationField('regenerateTotpBackupCodes', (t) =>
  t.field({
    type: ConfirmTotpSetupResultRef,
    args: {
      currentPassword: t.arg.string({ required: true }),
    },
    resolve: async (_root, args, ctx) => {
      if (!ctx.user)
        throw new GraphQLError('Unauthorized', { extensions: { code: ERROR_CODES.UNAUTHORIZED } });
      const { userResolver } = ctx.diScope.cradle;
      try {
        return await userResolver.regenerateTotpBackupCodes(
          ctx.user.sub,
          args.currentPassword,
          sessionAuthTime(ctx.user),
          deviceInfoFrom(ctx.request),
        );
      } catch (err) {
        throw fromCodedError(err);
      }
    },
  }),
);
