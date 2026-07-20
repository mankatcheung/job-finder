import { GraphQLError } from 'graphql';
import { builder } from '@/http/schema/builder.js';
import { CreateApiTokenPayloadRef } from '@/http/schema/types/ApiTokenType.js';

builder.mutationField('createApiToken', (t) =>
  t.field({
    type: CreateApiTokenPayloadRef,
    args: {
      name: t.arg.string({ required: true }),
    },
    resolve: async (_root, args, ctx) => {
      if (!ctx.user)
        throw new GraphQLError('Unauthorized', { extensions: { code: 'UNAUTHORIZED' } });
      const { createApiTokenUseCase, apiTokenMapper } = ctx.diScope.cradle;
      const { token, rawToken } = await createApiTokenUseCase.execute({
        userId: ctx.user.sub,
        name: args.name,
      });
      const dto = apiTokenMapper.toDTO(token);
      return { id: dto.id, name: dto.name, token: rawToken, createdAt: dto.createdAt };
    },
  }),
);

builder.mutationField('deleteApiToken', (t) =>
  t.boolean({
    args: {
      id: t.arg.id({ required: true }),
    },
    resolve: async (_root, args, ctx) => {
      if (!ctx.user)
        throw new GraphQLError('Unauthorized', { extensions: { code: 'UNAUTHORIZED' } });
      const { deleteApiTokenUseCase } = ctx.diScope.cradle;
      await deleteApiTokenUseCase.execute(args.id, ctx.user.sub);
      return true;
    },
  }),
);
