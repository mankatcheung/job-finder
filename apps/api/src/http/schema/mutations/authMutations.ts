import { GraphQLError } from 'graphql';
import { builder } from '@/http/schema/builder.js';
import { setAuthCookies, clearAuthCookies } from '@/http/schema/types/AuthPayloadType.js';
import { LoginResultRef } from '@/http/schema/types/LoginResultType.js';
import { ERROR_CODES } from '@/constants.js';

builder.mutationField('register', (t) =>
  t.boolean({
    args: {
      email: t.arg.string({ required: true }),
      password: t.arg.string({ required: true }),
    },
    resolve: async (_root, args, ctx) => {
      const { authResolver } = ctx.diScope.cradle;
      const tokens = await authResolver.register(args.email, args.password);
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
      const result = await authResolver.login(args.email, args.password);
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
      const tokens = await authResolver.loginWithTotp(args.email, args.password, args.code);
      setAuthCookies(ctx.reply, tokens.accessToken, tokens.refreshToken);
      return true;
    },
  }),
);

builder.mutationField('refreshToken', (t) =>
  t.boolean({
    resolve: (_root, _args, ctx) => {
      const refreshTokenCookie = ctx.request.cookies.jf_refresh_token;
      if (!refreshTokenCookie)
        throw new GraphQLError('No refresh token', {
          extensions: { code: ERROR_CODES.UNAUTHORIZED },
        });
      const { authResolver } = ctx.diScope.cradle;
      const tokens = authResolver.refreshToken(refreshTokenCookie);
      setAuthCookies(ctx.reply, tokens.accessToken, tokens.refreshToken);
      return true;
    },
  }),
);

builder.mutationField('logout', (t) =>
  t.boolean({
    resolve: (_root, _args, ctx) => {
      clearAuthCookies(ctx.reply);
      return true;
    },
  }),
);
