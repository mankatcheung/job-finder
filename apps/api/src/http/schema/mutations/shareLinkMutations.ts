import { GraphQLError } from 'graphql';
import { builder } from '#src/http/schema/builder.js';
import { CreateShareLinkPayloadRef } from '#src/http/schema/types/ShareLinkType.js';
import { ERROR_CODES } from '#src/constants.js';

builder.mutationField('createShareLink', (t) =>
  t.field({
    type: CreateShareLinkPayloadRef,
    args: {
      name: t.arg.string({ required: true }),
    },
    resolve: async (_root, args, ctx) => {
      if (!ctx.user)
        throw new GraphQLError('Unauthorized', { extensions: { code: ERROR_CODES.UNAUTHORIZED } });
      const { shareLinkResolver } = ctx.diScope.cradle;
      return shareLinkResolver.createShareLink(ctx.user.sub, args.name);
    },
  }),
);

builder.mutationField('deleteShareLink', (t) =>
  t.boolean({
    args: {
      id: t.arg.id({ required: true }),
    },
    resolve: async (_root, args, ctx) => {
      if (!ctx.user)
        throw new GraphQLError('Unauthorized', { extensions: { code: ERROR_CODES.UNAUTHORIZED } });
      const { shareLinkResolver } = ctx.diScope.cradle;
      return shareLinkResolver.deleteShareLink(ctx.user.sub, String(args.id));
    },
  }),
);
