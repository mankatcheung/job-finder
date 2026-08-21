import { GraphQLError } from 'graphql';
import { builder } from '#src/http/schema/builder.js';
import { DocumentDraftRef } from '#src/http/schema/types/DocumentDraftType.js';
import { fromCodedError } from '#src/http/errors/AppError.js';
import { ERROR_CODES } from '#src/constants.js';

// Returns the saved draft, like generateCoverLetter: the generated resume is
// persisted as a DocumentDraft and the client needs its id to open the editor.
builder.mutationField('generateResume', (t) =>
  t.field({
    type: DocumentDraftRef,
    args: {
      applicationId: t.arg.id({ required: true }),
    },
    resolve: async (_root, args, ctx) => {
      if (!ctx.user)
        throw new GraphQLError('Unauthorized', { extensions: { code: ERROR_CODES.UNAUTHORIZED } });
      const { documentDraftResolver } = ctx.diScope.cradle;
      try {
        return await documentDraftResolver.generateResumeDraft(
          ctx.user.sub,
          String(args.applicationId),
        );
      } catch (err) {
        throw fromCodedError(err);
      }
    },
  }),
);
