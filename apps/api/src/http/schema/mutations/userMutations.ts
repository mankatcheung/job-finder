import { GraphQLError } from 'graphql';
import { builder } from '#src/http/schema/builder.js';
import { DigestFrequencyEnum } from '#src/http/schema/types/enums/DigestFrequencyEnum.js';
import { clearAuthCookies } from '#src/http/schema/types/AuthPayloadType.js';
import { TotpSetupRef } from '#src/http/schema/types/TotpSetupType.js';
import { ConfirmTotpSetupResultRef } from '#src/http/schema/types/ConfirmTotpSetupType.js';
import { ImportSummaryRef } from '#src/http/schema/types/ImportSummaryType.js';
import { UploadUrlPayloadRef } from '#src/http/schema/types/AuthPayloadType.js';
import { deviceInfoFrom } from '#src/http/schema/requestDeviceInfo.js';
import { fromCodedError } from '#src/http/errors/AppError.js';
import { ERROR_CODES } from '#src/constants.js';
import type { JwtUser } from '#src/http/context.js';

/**
 * `null` skips the step-up freshness check entirely (API-token auth has no
 * session/freshness concept); a JWT session with no `authTime` claim (issued
 * before JEF-44) falls through as `undefined`, which is treated as stale.
 */
function sessionAuthTime(user: JwtUser): number | null | undefined {
  return user.sid ? user.authTime : null;
}

builder.mutationField('requestEmailChange', (t) =>
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
        await userResolver.requestEmailChange(
          ctx.user.sub,
          args.currentPassword,
          args.newEmail,
          sessionAuthTime(ctx.user),
        );
        return true;
      } catch (err) {
        throw fromCodedError(err);
      }
    },
  }),
);

builder.mutationField('confirmEmailChange', (t) =>
  t.boolean({
    args: {
      token: t.arg.string({ required: true }),
    },
    resolve: async (_root, args, ctx) => {
      const { userResolver } = ctx.diScope.cradle;
      try {
        await userResolver.confirmEmailChange(args.token, deviceInfoFrom(ctx.request));
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
        await userResolver.updatePassword(
          ctx.user.sub,
          args.currentPassword,
          args.newPassword,
          sessionAuthTime(ctx.user),
          deviceInfoFrom(ctx.request),
        );
        return true;
      } catch (err) {
        throw fromCodedError(err);
      }
    },
  }),
);

builder.mutationField('updateProfile', (t) =>
  t.boolean({
    args: {
      name: t.arg.string({ required: false }),
      timezone: t.arg.string({ required: false }),
      targetRole: t.arg.string({ required: false }),
      customAiPrompt: t.arg.string({ required: false }),
    },
    resolve: async (_root, args, ctx) => {
      if (!ctx.user)
        throw new GraphQLError('Unauthorized', { extensions: { code: ERROR_CODES.UNAUTHORIZED } });
      const { userResolver } = ctx.diScope.cradle;
      try {
        await userResolver.updateProfile(
          ctx.user.sub,
          args.name,
          args.timezone,
          args.targetRole,
          args.customAiPrompt,
        );
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
        await userResolver.deleteAccount(ctx.user.sub, args.password, sessionAuthTime(ctx.user));
        clearAuthCookies(ctx.reply);
        return true;
      } catch (err) {
        throw fromCodedError(err);
      }
    },
  }),
);

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

builder.mutationField('saveLlmApiKey', (t) =>
  t.boolean({
    args: {
      provider: t.arg.string({ required: true }),
      apiKey: t.arg.string({ required: true }),
      model: t.arg.string({ required: false }),
      baseUrl: t.arg.string({ required: false }),
    },
    resolve: async (_root, args, ctx) => {
      if (!ctx.user)
        throw new GraphQLError('Unauthorized', { extensions: { code: ERROR_CODES.UNAUTHORIZED } });
      const { userResolver } = ctx.diScope.cradle;
      try {
        await userResolver.saveLlmApiKey(
          ctx.user.sub,
          args.provider,
          args.apiKey,
          args.model,
          args.baseUrl,
        );
        return true;
      } catch (err) {
        throw fromCodedError(err);
      }
    },
  }),
);

builder.mutationField('deleteLlmApiKey', (t) =>
  t.boolean({
    args: {
      provider: t.arg.string({ required: true }),
    },
    resolve: async (_root, args, ctx) => {
      if (!ctx.user)
        throw new GraphQLError('Unauthorized', { extensions: { code: ERROR_CODES.UNAUTHORIZED } });
      const { userResolver } = ctx.diScope.cradle;
      try {
        await userResolver.deleteLlmApiKey(ctx.user.sub, args.provider);
        return true;
      } catch (err) {
        throw fromCodedError(err);
      }
    },
  }),
);

builder.mutationField('setDefaultLlmProvider', (t) =>
  t.boolean({
    args: {
      provider: t.arg.string({ required: true }),
    },
    resolve: async (_root, args, ctx) => {
      if (!ctx.user)
        throw new GraphQLError('Unauthorized', { extensions: { code: ERROR_CODES.UNAUTHORIZED } });
      const { userResolver } = ctx.diScope.cradle;
      try {
        await userResolver.setDefaultLlmProvider(ctx.user.sub, args.provider);
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

builder.mutationField('requestAvatarUploadUrl', (t) =>
  t.field({
    type: UploadUrlPayloadRef,
    args: {
      filename: t.arg.string({ required: true }),
      mimeType: t.arg.string({ required: true }),
    },
    resolve: async (_root, args, ctx) => {
      if (!ctx.user)
        throw new GraphQLError('Unauthorized', { extensions: { code: ERROR_CODES.UNAUTHORIZED } });
      const { userResolver } = ctx.diScope.cradle;
      try {
        return await userResolver.requestAvatarUploadUrl(
          ctx.user.sub,
          args.filename,
          args.mimeType,
        );
      } catch (err) {
        throw fromCodedError(err);
      }
    },
  }),
);

builder.mutationField('confirmAvatar', (t) =>
  t.string({
    args: {
      storageKey: t.arg.string({ required: true }),
      mimeType: t.arg.string({ required: true }),
      sizeBytes: t.arg.int({ required: true }),
    },
    resolve: async (_root, args, ctx) => {
      if (!ctx.user)
        throw new GraphQLError('Unauthorized', { extensions: { code: ERROR_CODES.UNAUTHORIZED } });
      const { userResolver } = ctx.diScope.cradle;
      try {
        return await userResolver.confirmAvatar(
          ctx.user.sub,
          args.storageKey,
          args.mimeType,
          args.sizeBytes,
        );
      } catch (err) {
        throw fromCodedError(err);
      }
    },
  }),
);

builder.mutationField('removeAvatar', (t) =>
  t.boolean({
    resolve: async (_root, _args, ctx) => {
      if (!ctx.user)
        throw new GraphQLError('Unauthorized', { extensions: { code: ERROR_CODES.UNAUTHORIZED } });
      const { userResolver } = ctx.diScope.cradle;
      try {
        await userResolver.removeAvatar(ctx.user.sub);
        return true;
      } catch (err) {
        throw fromCodedError(err);
      }
    },
  }),
);

builder.mutationField('updateNotificationPreferences', (t) =>
  t.boolean({
    args: {
      weeklyDigestEnabled: t.arg.boolean({ required: false }),
      digestFrequency: t.arg({ type: DigestFrequencyEnum, required: false }),
      followUpRemindersEnabled: t.arg.boolean({ required: false }),
      pushNotificationsEnabled: t.arg.boolean({ required: false }),
      weeklyApplicationGoal: t.arg.int({ required: false }),
    },
    resolve: async (_root, args, ctx) => {
      if (!ctx.user)
        throw new GraphQLError('Unauthorized', { extensions: { code: ERROR_CODES.UNAUTHORIZED } });
      const { userResolver } = ctx.diScope.cradle;
      try {
        await userResolver.updateNotificationPreferences(
          ctx.user.sub,
          args.weeklyDigestEnabled ?? undefined,
          args.followUpRemindersEnabled ?? undefined,
          args.pushNotificationsEnabled ?? undefined,
          args.weeklyApplicationGoal ?? undefined,
          args.digestFrequency ?? undefined,
        );
        return true;
      } catch (err) {
        throw fromCodedError(err);
      }
    },
  }),
);

builder.mutationField('requestAddBackupEmail', (t) =>
  t.boolean({
    args: {
      currentPassword: t.arg.string({ required: true }),
      backupEmail: t.arg.string({ required: true }),
    },
    resolve: async (_root, args, ctx) => {
      if (!ctx.user)
        throw new GraphQLError('Unauthorized', { extensions: { code: ERROR_CODES.UNAUTHORIZED } });
      const { userResolver } = ctx.diScope.cradle;
      try {
        await userResolver.requestAddBackupEmail(
          ctx.user.sub,
          args.backupEmail,
          args.currentPassword,
          sessionAuthTime(ctx.user),
        );
        return true;
      } catch (err) {
        throw fromCodedError(err);
      }
    },
  }),
);

builder.mutationField('confirmBackupEmail', (t) =>
  t.boolean({
    args: {
      token: t.arg.string({ required: true }),
    },
    resolve: async (_root, args, ctx) => {
      const { userResolver } = ctx.diScope.cradle;
      try {
        await userResolver.confirmBackupEmail(args.token);
        return true;
      } catch (err) {
        throw fromCodedError(err);
      }
    },
  }),
);

builder.mutationField('removeBackupEmail', (t) =>
  t.boolean({
    args: {
      currentPassword: t.arg.string({ required: true }),
    },
    resolve: async (_root, args, ctx) => {
      if (!ctx.user)
        throw new GraphQLError('Unauthorized', { extensions: { code: ERROR_CODES.UNAUTHORIZED } });
      const { userResolver } = ctx.diScope.cradle;
      try {
        await userResolver.removeBackupEmail(
          ctx.user.sub,
          args.currentPassword,
          sessionAuthTime(ctx.user),
        );
        return true;
      } catch (err) {
        throw fromCodedError(err);
      }
    },
  }),
);
