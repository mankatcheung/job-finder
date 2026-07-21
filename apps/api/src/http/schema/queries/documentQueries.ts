import { GraphQLError } from 'graphql';
import { builder } from '@/http/schema/builder.js';
import { DocumentRef } from '@/http/schema/types/DocumentType.js';
import { ERROR_CODES } from '@/constants.js';

builder.queryField('documents', (t) =>
  t.field({
    type: [DocumentRef],
    args: {
      applicationId: t.arg.id({ required: true }),
    },
    resolve: async (_root, args, ctx) => {
      if (!ctx.user)
        throw new GraphQLError('Unauthorized', { extensions: { code: ERROR_CODES.UNAUTHORIZED } });
      const { documentResolver } = ctx.diScope.cradle;
      return documentResolver.getDocuments(ctx.user.sub, args.applicationId);
    },
  }),
);
