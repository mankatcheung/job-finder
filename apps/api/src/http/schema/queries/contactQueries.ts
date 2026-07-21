import { GraphQLError } from 'graphql';
import { builder } from '@/http/schema/builder.js';
import { ContactRef } from '@/http/schema/types/ContactType.js';
import { ERROR_CODES } from '@/constants.js';

builder.queryField('contacts', (t) =>
  t.field({
    type: [ContactRef],
    args: {
      applicationId: t.arg.id({ required: true }),
    },
    resolve: async (_root, args, ctx) => {
      if (!ctx.user)
        throw new GraphQLError('Unauthorized', { extensions: { code: ERROR_CODES.UNAUTHORIZED } });
      const { contactResolver } = ctx.diScope.cradle;
      return contactResolver.getContacts(ctx.user.sub, args.applicationId);
    },
  }),
);
