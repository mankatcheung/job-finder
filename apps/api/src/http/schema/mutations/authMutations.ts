import { GraphQLError } from 'graphql';
import { builder } from '#src/http/schema/builder.js';
import { setAuthCookies, clearAuthCookies } from '#src/http/schema/types/AuthPayloadType.js';
import { LoginResultRef } from '#src/http/schema/types/LoginResultType.js';
import { deviceInfoFrom } from '#src/http/schema/requestDeviceInfo.js';
import { fromCodedError } from '#src/http/errors/AppError.js';
import { COOKIES, ERROR_CODES } from '#src/constants.js';

builder.mutationField('register', (t) =>
  t.string({
    args: {
      email: t.arg.string({ required: true }),
      password: t.arg.string({ required: true }),
    },
    resolve: async (_root, args, ctx) => {
      const { authResolver } = ctx.diScope.cradle;
      const tokens = await authResolver.register(
        args.email,
        args.password,
        deviceInfoFrom(ctx.request),
      );
      setAuthCookies(ctx.reply, tokens.accessToken, tokens.refreshToken);
      return tokens.accessToken;
    },
  }),
);

builder.mutationField('login', (t) =>
  t.field({
    type: LoginResultRef,
    args: {
      email: t.arg.string({ required: true }),
      password: t.arg.string({ required: true }),
    },
    resolve: async (_root, args, ctx) => {
      const { authResolver } = ctx.diScope.cradle;
      const result = await authResolver.login(
        args.email,
        args.password,
        deviceInfoFrom(ctx.request),
      );
      if (result.tokens) {
        setAuthCookies(ctx.reply, result.tokens.accessToken, result.tokens.refreshToken);
      }
      return {
        success: !result.totpRequired,
        totpRequired: result.totpRequired,
        accessToken: result.tokens?.accessToken ?? null,
      };
    },
  }),
);

builder.mutationField('loginWithTotp', (t) =>
  t.string({
    args: {
      email: t.arg.string({ required: true }),
      password: t.arg.string({ required: true }),
      code: t.arg.string({ required: true }),
    },
    resolve: async (_root, args, ctx) => {
      const { authResolver } = ctx.diScope.cradle;
      const tokens = await authResolver.loginWithTotp(
        args.email,
        args.password,
        args.code,
        deviceInfoFrom(ctx.request),
      );
      setAuthCookies(ctx.reply, tokens.accessToken, tokens.refreshToken);
      return tokens.accessToken;
    },
  }),
);

builder.mutationField('reauthenticate', (t) =>
  t.field({
    type: LoginResultRef,
    args: {
      password: t.arg.string({ required: true }),
      code: t.arg.string({ required: false }),
    },
    resolve: async (_root, args, ctx) => {
      if (!ctx.user || !ctx.user.sid)
        throw new GraphQLError('Unauthorized', { extensions: { code: ERROR_CODES.UNAUTHORIZED } });
      const { authResolver } = ctx.diScope.cradle;
      try {
        const result = await authResolver.reauthenticate(
          ctx.user.sub,
          ctx.user.sid,
          args.password,
          args.code ?? undefined,
        );
        if (result.tokens) {
          setAuthCookies(ctx.reply, result.tokens.accessToken, result.tokens.refreshToken);
        }
        return {
          success: !result.totpRequired,
          totpRequired: result.totpRequired,
          accessToken: result.tokens?.accessToken ?? null,
        };
      } catch (err) {
        throw fromCodedError(err);
      }
    },
  }),
);

builder.mutationField('refreshToken', (t) =>
  t.string({
    resolve: async (_root, _args, ctx) => {
      const refreshTokenCookie = ctx.request.cookies[COOKIES.REFRESH_TOKEN];
      if (!refreshTokenCookie)
        throw new GraphQLError('No refresh token', {
          extensions: { code: ERROR_CODES.UNAUTHORIZED },
        });
      const { authResolver } = ctx.diScope.cradle;
      const tokens = await authResolver.refreshToken(refreshTokenCookie);
      setAuthCookies(ctx.reply, tokens.accessToken, tokens.refreshToken);
      return tokens.accessToken;
    },
  }),
);

builder.mutationField('logout', (t) =>
  t.boolean({
    resolve: async (_root, _args, ctx) => {
      if (ctx.user?.sid) {
        // Best-effort — an already-expired/missing session shouldn't block logout.
        const { revokeSessionUseCase } = ctx.diScope.cradle;
        await revokeSessionUseCase.execute(ctx.user.sid, ctx.user.sub).catch(() => {});
      }
      clearAuthCookies(ctx.reply);
      return true;
    },
  }),
);

builder.mutationField('requestPasswordReset', (t) =>
  t.boolean({
    args: {
      email: t.arg.string({ required: true }),
    },
    resolve: async (_root, args, ctx) => {
      const { authResolver } = ctx.diScope.cradle;
      try {
        await authResolver.requestPasswordReset(args.email, ctx.request.ip ?? null);
        return true;
      } catch (err) {
        throw fromCodedError(err);
      }
    },
  }),
);

builder.mutationField('resetPassword', (t) =>
  t.boolean({
    args: {
      token: t.arg.string({ required: true }),
      newPassword: t.arg.string({ required: true }),
    },
    resolve: async (_root, args, ctx) => {
      const { authResolver } = ctx.diScope.cradle;
      try {
        await authResolver.resetPassword(args.token, args.newPassword);
        return true;
      } catch (err) {
        throw fromCodedError(err);
      }
    },
  }),
);

builder.mutationField('verifyEmail', (t) =>
  t.boolean({
    args: {
      token: t.arg.string({ required: true }),
    },
    resolve: async (_root, args, ctx) => {
      const { authResolver } = ctx.diScope.cradle;
      try {
        await authResolver.verifyEmail(args.token);
        return true;
      } catch (err) {
        throw fromCodedError(err);
      }
    },
  }),
);
