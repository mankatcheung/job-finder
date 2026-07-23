import { GraphQLError } from 'graphql';
import { builder } from '@/http/schema/builder.js';
import { clearAuthCookies } from '@/http/schema/types/AuthPayloadType.js';
import { ImportSummaryRef } from '@/http/schema/types/ImportSummaryType.js';
import { fromCodedError } from '@/http/errors/AppError.js';
import { ERROR_CODES } from '@/constants.js';

builder.mutationField('updateEmail', (t) =>
  t.boolean({
    args: {
      currentPassword: t.arg.string({ required: true }),
      newEmail: t.arg.string({ required: true }),
    },
    resolve: async (_root, args, ctx) => {
      if (!ctx.user)
        throw new GraphQLError('Unauthorized', { extensions: { code: ERROR_CODES.UNAUTHORIZED } });
      const { userResolver } = ctx.diScope.cradle;
      try {
        await userResolver.updateEmail(ctx.user.sub, args.currentPassword, args.newEmail);
        return true;
      } catch (err) {
        throw fromCodedError(err);
      }
    },
  }),
);

builder.mutationField('updatePassword', (t) =>
  t.boolean({
    args: {
      currentPassword: t.arg.string({ required: true }),
      newPassword: t.arg.string({ required: true }),
    },
    resolve: async (_root, args, ctx) => {
      if (!ctx.user)
        throw new GraphQLError('Unauthorized', { extensions: { code: ERROR_CODES.UNAUTHORIZED } });
      const { userResolver } = ctx.diScope.cradle;
      try {
        await userResolver.updatePassword(ctx.user.sub, args.currentPassword, args.newPassword);
        return true;
      } catch (err) {
        throw fromCodedError(err);
      }
    },
  }),
);

builder.mutationField('deleteAccount', (t) =>
  t.boolean({
    args: {
      password: t.arg.string({ required: true }),
    },
    resolve: async (_root, args, ctx) => {
      if (!ctx.user)
        throw new GraphQLError('Unauthorized', { extensions: { code: ERROR_CODES.UNAUTHORIZED } });
      const { userResolver } = ctx.diScope.cradle;
      try {
        await userResolver.deleteAccount(ctx.user.sub, args.password);
        clearAuthCookies(ctx.reply);
        return true;
      } catch (err) {
        throw fromCodedError(err);
      }
    },
  }),
);

builder.mutationField('importUserData', (t) =>
  t.field({
    type: ImportSummaryRef,
    args: {
      data: t.arg.string({ required: true }),
    },
    resolve: async (_root, args, ctx) => {
      if (!ctx.user)
        throw new GraphQLError('Unauthorized', { extensions: { code: ERROR_CODES.UNAUTHORIZED } });
      const { userResolver } = ctx.diScope.cradle;
      try {
        return await userResolver.importUserData(ctx.user.sub, args.data);
      } catch (err) {
        throw fromCodedError(err);
      }
    },
  }),
);
