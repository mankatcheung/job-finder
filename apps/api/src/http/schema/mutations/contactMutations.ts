import { GraphQLError } from 'graphql';
import { builder } from '@/http/schema/builder.js';
import { ContactRef } from '@/http/schema/types/ContactType.js';
import { ERROR_CODES } from '@/constants.js';

builder.mutationField('createContact', (t) =>
  t.field({
    type: ContactRef,
    args: {
      applicationId: t.arg.id({ required: true }),
      name: t.arg.string({ required: true }),
      role: t.arg.string({ required: false }),
      email: t.arg.string({ required: false }),
      phone: t.arg.string({ required: false }),
      linkedinUrl: t.arg.string({ required: false }),
      notes: t.arg.string({ required: false }),
    },
    resolve: async (_root, args, ctx) => {
      if (!ctx.user)
        throw new GraphQLError('Unauthorized', { extensions: { code: ERROR_CODES.UNAUTHORIZED } });
      const { contactResolver } = ctx.diScope.cradle;
      return contactResolver.createContact(ctx.user.sub, args);
    },
  }),
);

builder.mutationField('updateContact', (t) =>
  t.field({
    type: ContactRef,
    args: {
      id: t.arg.id({ required: true }),
      name: t.arg.string({ required: false }),
      role: t.arg.string({ required: false }),
      email: t.arg.string({ required: false }),
      phone: t.arg.string({ required: false }),
      linkedinUrl: t.arg.string({ required: false }),
      notes: t.arg.string({ required: false }),
    },
    resolve: async (_root, args, ctx) => {
      if (!ctx.user)
        throw new GraphQLError('Unauthorized', { extensions: { code: ERROR_CODES.UNAUTHORIZED } });
      const { contactResolver } = ctx.diScope.cradle;
      const { id, name, ...rest } = args;
      return contactResolver.updateContact(ctx.user.sub, id, {
        ...(name != null ? { name } : {}),
        ...rest,
      });
    },
  }),
);

builder.mutationField('deleteContact', (t) =>
  t.field({
    type: 'Boolean',
    args: {
      id: t.arg.id({ required: true }),
    },
    resolve: async (_root, args, ctx) => {
      if (!ctx.user)
        throw new GraphQLError('Unauthorized', { extensions: { code: ERROR_CODES.UNAUTHORIZED } });
      const { contactResolver } = ctx.diScope.cradle;
      return contactResolver.deleteContact(ctx.user.sub, args.id);
    },
  }),
);
