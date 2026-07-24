import { GraphQLError } from 'graphql';
import { builder } from '@/http/schema/builder.js';
import { CreateApiTokenPayloadRef } from '@/http/schema/types/ApiTokenType.js';
import { ApiTokenScopeEnum } from '@/http/schema/types/enums/ApiTokenScopeEnum.js';
import type { ApiTokenScope } from '@/domain/apiToken/ApiToken.js';
import { ERROR_CODES } from '@/constants.js';

builder.mutationField('createApiToken', (t) =>
  t.field({
    type: CreateApiTokenPayloadRef,
    args: {
      name: t.arg.string({ required: true }),
      scope: t.arg({ type: ApiTokenScopeEnum, required: false }),
    },
    resolve: async (_root, args, ctx) => {
      if (!ctx.user)
        throw new GraphQLError('Unauthorized', { extensions: { code: ERROR_CODES.UNAUTHORIZED } });
      const { apiTokenResolver } = ctx.diScope.cradle;
      return apiTokenResolver.createApiToken(
        ctx.user.sub,
        args.name,
        args.scope as ApiTokenScope | undefined,
      );
    },
  }),
);

builder.mutationField('deleteApiToken', (t) =>
  t.boolean({
    args: {
      id: t.arg.id({ required: true }),
    },
    resolve: async (_root, args, ctx) => {
      if (!ctx.user)
        throw new GraphQLError('Unauthorized', { extensions: { code: ERROR_CODES.UNAUTHORIZED } });
      const { apiTokenResolver } = ctx.diScope.cradle;
      return apiTokenResolver.deleteApiToken(ctx.user.sub, String(args.id));
    },
  }),
);
