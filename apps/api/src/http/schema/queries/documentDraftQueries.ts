import { GraphQLError } from 'graphql';
import { builder } from '#src/http/schema/builder.js';
import { DocumentDraftRef } from '#src/http/schema/types/DocumentDraftType.js';
import { ERROR_CODES } from '#src/use-cases/errors/errorCodes.js';

builder.queryField('documentDrafts', (t) =>
  t.field({
    type: [DocumentDraftRef],
    args: {
      applicationId: t.arg.id({ required: true }),
    },
    resolve: async (_root, args, ctx) => {
      if (!ctx.user)
        throw new GraphQLError('Unauthorized', { extensions: { code: ERROR_CODES.UNAUTHORIZED } });
      const { documentDraftResolver } = ctx.diScope.cradle;
      return documentDraftResolver.getDocumentDrafts(ctx.user.sub, args.applicationId);
    },
  }),
);

builder.queryField('documentDraft', (t) =>
  t.field({
    type: DocumentDraftRef,
    args: {
      id: t.arg.id({ required: true }),
    },
    resolve: async (_root, args, ctx) => {
      if (!ctx.user)
        throw new GraphQLError('Unauthorized', { extensions: { code: ERROR_CODES.UNAUTHORIZED } });
      const { documentDraftResolver } = ctx.diScope.cradle;
      return documentDraftResolver.getDocumentDraft(ctx.user.sub, args.id);
    },
  }),
);
