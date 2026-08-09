import { GraphQLError } from 'graphql';
import { builder } from '#src/http/schema/builder.js';
import { DocumentVersionOutcomeRef } from '#src/http/schema/types/DocumentVersionOutcomeType.js';
import { ERROR_CODES } from '#src/constants.js';

builder.queryField('documentVersionOutcomes', (t) =>
  t.field({
    type: [DocumentVersionOutcomeRef],
    resolve: async (_root, _args, ctx) => {
      if (!ctx.user)
        throw new GraphQLError('Unauthorized', { extensions: { code: ERROR_CODES.UNAUTHORIZED } });
      const { getDocumentVersionOutcomesUseCase } = ctx.diScope.cradle;
      return getDocumentVersionOutcomesUseCase.execute({ userId: ctx.user.sub });
    },
  }),
);
