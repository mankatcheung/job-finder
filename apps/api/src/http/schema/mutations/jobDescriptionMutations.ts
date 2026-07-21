import { GraphQLError } from 'graphql';
import { builder } from '@/http/schema/builder.js';
import { ParsedJobDescriptionRef } from '@/http/schema/types/ParsedJobDescriptionType.js';

builder.mutationField('parseJobDescription', (t) =>
  t.field({
    type: ParsedJobDescriptionRef,
    args: {
      text: t.arg.string({ required: false }),
      url: t.arg.string({ required: false }),
    },
    resolve: async (_root, args, ctx) => {
      if (!ctx.user)
        throw new GraphQLError('Unauthorized', { extensions: { code: 'UNAUTHORIZED' } });
      const { parseJobDescriptionUseCase } = ctx.diScope.cradle;
      try {
        return await parseJobDescriptionUseCase.execute({ text: args.text, url: args.url });
      } catch (err) {
        throw new GraphQLError((err as Error).message ?? 'Failed to parse job description');
      }
    },
  }),
);
