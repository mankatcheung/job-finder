import { GraphQLError } from 'graphql';
import { builder } from '#src/http/schema/builder.js';
import { CompanyBriefingRef } from '#src/http/schema/types/CompanyBriefingType.js';
import { fromCodedError } from '#src/http/errors/AppError.js';
import { ERROR_CODES } from '#src/constants.js';

builder.queryField('companyBriefing', (t) =>
  t.field({
    type: CompanyBriefingRef,
    // Nullable: "not generated yet" is the tab's normal opening state, not an
    // error the client has to distinguish from a failure.
    nullable: true,
    args: {
      applicationId: t.arg.id({ required: true }),
    },
    resolve: async (_root, args, ctx) => {
      if (!ctx.user)
        throw new GraphQLError('Unauthorized', { extensions: { code: ERROR_CODES.UNAUTHORIZED } });
      const { companyBriefingResolver } = ctx.diScope.cradle;
      try {
        return await companyBriefingResolver.getCompanyBriefing(
          ctx.user.sub,
          String(args.applicationId),
        );
      } catch (err) {
        throw fromCodedError(err);
      }
    },
  }),
);
