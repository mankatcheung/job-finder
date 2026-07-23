import { GraphQLError } from 'graphql';
import type { FastifyRequest } from 'fastify';
import { builder } from '@/http/schema/builder.js';
import { setAuthCookies, clearAuthCookies } from '@/http/schema/types/AuthPayloadType.js';
import { LoginResultRef } from '@/http/schema/types/LoginResultType.js';
import type { DeviceInfo } from '@/interface-adapters/resolvers/AuthResolver.js';
import { fromCodedError } from '@/http/errors/AppError.js';
import { ERROR_CODES } from '@/constants.js';

function deviceInfoFrom(request: FastifyRequest): DeviceInfo {
  return {
    userAgent: request.headers['user-agent'] ?? null,
    ipAddress: request.ip ?? null,
  };
}

builder.mutationField('register', (t) =>
  t.boolean({
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
      return true;
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
      const result = await authResolver.login(args.email, args.password, deviceInfoFrom(ctx.request));
      if (result.tokens) {
        setAuthCookies(ctx.reply, result.tokens.accessToken, result.tokens.refreshToken);
      }
      return { success: !result.totpRequired, totpRequired: result.totpRequired };
    },
  }),
);

builder.mutationField('loginWithTotp', (t) =>
  t.boolean({
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
      return true;
    },
  }),
);

builder.mutationField('refreshToken', (t) =>
  t.boolean({
    resolve: async (_root, _args, ctx) => {
      const refreshTokenCookie = ctx.request.cookies.jf_refresh_token;
      if (!refreshTokenCookie)
        throw new GraphQLError('No refresh token', {
          extensions: { code: ERROR_CODES.UNAUTHORIZED },
        });
      const { authResolver } = ctx.diScope.cradle;
      const tokens = await authResolver.refreshToken(refreshTokenCookie);
      setAuthCookies(ctx.reply, tokens.accessToken, tokens.refreshToken);
      return true;
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
