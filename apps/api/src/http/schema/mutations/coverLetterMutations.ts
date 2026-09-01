import { GraphQLError } from 'graphql';
import { builder } from '#src/http/schema/builder.js';
import { DocumentDraftRef } from '#src/http/schema/types/DocumentDraftType.js';
import { fromCodedError } from '#src/http/errors/AppError.js';
import { ERROR_CODES } from '#src/use-cases/errors/errorCodes.js';

// Returns the saved draft rather than the letter as a string: the generated
// text is now persisted (JEF-195), and the client needs its id to open it in
// the editor.
builder.mutationField('generateCoverLetter', (t) =>
  t.field({
    type: DocumentDraftRef,
    args: {
      applicationId: t.arg.id({ required: true }),
      resumeText: t.arg.string({ required: false }),
    },
    resolve: async (_root, args, ctx) => {
      if (!ctx.user)
        throw new GraphQLError('Unauthorized', { extensions: { code: ERROR_CODES.UNAUTHORIZED } });
      const { documentDraftResolver } = ctx.diScope.cradle;
      try {
        return await documentDraftResolver.generateCoverLetterDraft(
          ctx.user.sub,
          String(args.applicationId),
          args.resumeText,
        );
      } catch (err) {
        throw fromCodedError(err);
      }
    },
  }),
);
