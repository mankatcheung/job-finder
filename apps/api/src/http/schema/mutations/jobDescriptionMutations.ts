import { GraphQLError } from 'graphql';
import { builder } from '#src/http/schema/builder.js';
import { ParsedJobDescriptionRef } from '#src/http/schema/types/ParsedJobDescriptionType.js';
import { fromCodedError } from '#src/http/errors/AppError.js';
import { ERROR_CODES } from '#src/use-cases/errors/errorCodes.js';

builder.mutationField('parseJobDescription', (t) =>
  t.field({
    type: ParsedJobDescriptionRef,
    args: {
      text: t.arg.string({ required: false }),
      url: t.arg.string({ required: false }),
    },
    resolve: async (_root, args, ctx) => {
      if (!ctx.user)
        throw new GraphQLError('Unauthorized', { extensions: { code: ERROR_CODES.UNAUTHORIZED } });
      const { parseJobDescriptionUseCase } = ctx.diScope.cradle;
      try {
        return await parseJobDescriptionUseCase.execute({
          text: args.text,
          url: args.url,
          userId: ctx.user.sub,
        });
      } catch (err) {
        throw fromCodedError(err);
      }
    },
  }),
);
