import { GraphQLError } from 'graphql';
import { builder } from '@/http/schema/builder.js';
import { OAuthProviderEnum } from '@/http/schema/types/enums/OAuthProviderEnum.js';
import { fromCodedError } from '@/http/errors/AppError.js';
import { ERROR_CODES } from '@/constants.js';

builder.mutationField('unlinkOAuthAccount', (t) =>
  t.boolean({
    args: {
      provider: t.arg({ type: OAuthProviderEnum, required: true }),
    },
    resolve: async (_root, args, ctx) => {
      if (!ctx.user)
        throw new GraphQLError('Unauthorized', { extensions: { code: ERROR_CODES.UNAUTHORIZED } });
      const { oauthResolver } = ctx.diScope.cradle;
      try {
        return await oauthResolver.unlinkAccount(ctx.user.sub, args.provider);
      } catch (err) {
        throw fromCodedError(err);
      }
    },
  }),
);
