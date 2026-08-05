import { GraphQLError } from 'graphql';
import { builder } from '#src/http/schema/builder.js';
import { ERROR_CODES } from '#src/constants.js';
import {
  PipelineStageCategoryEnum,
  PipelineStageRef,
} from '#src/http/schema/types/PipelineStageType.js';

const CreatePipelineStageInput = builder.inputType('CreatePipelineStageInput', {
  fields: (t) => ({
    key: t.string({ required: true }),
    name: t.string({ required: true }),
    color: t.string({ required: false, defaultValue: 'gray' }),
    position: t.int({ required: true }),
    category: t.field({ type: PipelineStageCategoryEnum, required: true }),
  }),
});

const UpdatePipelineStageInput = builder.inputType('UpdatePipelineStageInput', {
  fields: (t) => ({
    name: t.string({ required: false }),
    color: t.string({ required: false }),
    position: t.int({ required: false }),
    category: t.field({ type: PipelineStageCategoryEnum, required: false }),
  }),
});

function requireUser(ctx: { user: { sub: string } | null }) {
  if (!ctx.user)
    throw new GraphQLError('Unauthorized', { extensions: { code: ERROR_CODES.UNAUTHORIZED } });
  return ctx.user.sub;
}

builder.mutationField('createPipelineStage', (t) =>
  t.field({
    type: PipelineStageRef,
    args: { input: t.arg({ type: CreatePipelineStageInput, required: true }) },
    resolve: (_root, args, ctx) => {
      const userId = requireUser(ctx);
      return ctx.diScope.cradle.pipelineStageResolver.createStage(userId, {
        ...args.input,
        color: args.input.color ?? 'gray',
      });
    },
  }),
);

builder.mutationField('updatePipelineStage', (t) =>
  t.field({
    type: PipelineStageRef,
    args: {
      id: t.arg.id({ required: true }),
      input: t.arg({ type: UpdatePipelineStageInput, required: true }),
    },
    resolve: (_root, args, ctx) => {
      const userId = requireUser(ctx);
      return ctx.diScope.cradle.pipelineStageResolver.updateStage(userId, {
        id: args.id,
        name: args.input.name ?? undefined,
        color: args.input.color ?? undefined,
        position: args.input.position ?? undefined,
        category: args.input.category ?? undefined,
      });
    },
  }),
);

builder.mutationField('deletePipelineStage', (t) =>
  t.field({
    type: 'Boolean',
    args: { id: t.arg.id({ required: true }) },
    resolve: (_root, args, ctx) => {
      const userId = requireUser(ctx);
      return ctx.diScope.cradle.pipelineStageResolver.deleteStage(userId, args.id);
    },
  }),
);
