import { GraphQLError } from 'graphql';
import { builder } from '@/http/schema/builder.js';
import { NoteRef } from '@/http/schema/types/NoteType.js';

builder.mutationField('createNote', (t) =>
  t.field({
    type: NoteRef,
    args: {
      applicationId: t.arg.id({ required: true }),
      content: t.arg.string({ required: true }),
    },
    resolve: async (_root, args, ctx) => {
      if (!ctx.user)
        throw new GraphQLError('Unauthorized', { extensions: { code: 'UNAUTHORIZED' } });
      const { noteResolver } = ctx.diScope.cradle;
      return noteResolver.createNote(ctx.user.sub, args.applicationId, args.content);
    },
  }),
);

builder.mutationField('updateNote', (t) =>
  t.field({
    type: NoteRef,
    args: {
      id: t.arg.id({ required: true }),
      content: t.arg.string({ required: true }),
    },
    resolve: async (_root, args, ctx) => {
      if (!ctx.user)
        throw new GraphQLError('Unauthorized', { extensions: { code: 'UNAUTHORIZED' } });
      const { noteResolver } = ctx.diScope.cradle;
      return noteResolver.updateNote(ctx.user.sub, args.id, args.content);
    },
  }),
);

builder.mutationField('deleteNote', (t) =>
  t.field({
    type: 'Boolean',
    args: {
      id: t.arg.id({ required: true }),
    },
    resolve: async (_root, args, ctx) => {
      if (!ctx.user)
        throw new GraphQLError('Unauthorized', { extensions: { code: 'UNAUTHORIZED' } });
      const { noteResolver } = ctx.diScope.cradle;
      return noteResolver.deleteNote(ctx.user.sub, args.id);
    },
  }),
);
