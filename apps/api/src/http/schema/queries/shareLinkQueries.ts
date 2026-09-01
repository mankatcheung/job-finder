import { GraphQLError } from 'graphql';
import { builder } from '#src/http/schema/builder.js';
import { ShareLinkRef, SharedSummaryRef } from '#src/http/schema/types/ShareLinkType.js';
import { ERROR_CODES } from '#src/use-cases/errors/errorCodes.js';

builder.queryField('shareLinks', (t) =>
  t.field({
    type: [ShareLinkRef],
    resolve: async (_root, _args, ctx) => {
      if (!ctx.user)
        throw new GraphQLError('Unauthorized', { extensions: { code: ERROR_CODES.UNAUTHORIZED } });
      const { shareLinkResolver } = ctx.diScope.cradle;
      return shareLinkResolver.listShareLinks(ctx.user.sub);
    },
  }),
);

// Deliberately unauthenticated — this is the public, read-only summary a
// mentor/accountability-partner views via the share link. See JEF-60.
builder.queryField('sharedSummary', (t) =>
  t.field({
    type: SharedSummaryRef,
    nullable: true,
    args: {
      token: t.arg.string({ required: true }),
    },
    resolve: async (_root, args, ctx) => {
      const { shareLinkResolver } = ctx.diScope.cradle;
      return shareLinkResolver.getSharedSummary(args.token);
    },
  }),
);
