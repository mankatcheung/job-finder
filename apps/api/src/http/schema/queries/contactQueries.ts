import { GraphQLError } from 'graphql';
import { builder } from '@/http/schema/builder.js';
import { ContactRef } from '@/http/schema/types/ContactType.js';

builder.queryField('contacts', (t) =>
  t.field({
    type: [ContactRef],
    args: {
      applicationId: t.arg.id({ required: true }),
    },
    resolve: async (_root, args, ctx) => {
      if (!ctx.user)
        throw new GraphQLError('Unauthorized', { extensions: { code: 'UNAUTHORIZED' } });
      const { contactResolver } = ctx.diScope.cradle;
      return contactResolver.getContacts(ctx.user.sub, args.applicationId);
    },
  }),
);
