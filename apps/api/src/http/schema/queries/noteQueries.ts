import { GraphQLError } from 'graphql';
import { builder } from '@/http/schema/builder.js';
import { NoteRef } from '@/http/schema/types/NoteType.js';
import { ERROR_CODES } from '@/constants.js';

builder.queryField('notes', (t) =>
  t.field({
    type: [NoteRef],
    args: {
      applicationId: t.arg.id({ required: true }),
    },
    resolve: async (_root, args, ctx) => {
      if (!ctx.user)
        throw new GraphQLError('Unauthorized', { extensions: { code: ERROR_CODES.UNAUTHORIZED } });
      const { noteResolver } = ctx.diScope.cradle;
      return noteResolver.getNotes(ctx.user.sub, args.applicationId);
    },
  }),
);
