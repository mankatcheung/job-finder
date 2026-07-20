import { GraphQLError } from 'graphql';
import { builder } from '@/http/schema/builder.js';
import { InterviewRoundRef } from '@/http/schema/types/InterviewRoundType.js';
import {
  InterviewRoundTypeEnum,
  InterviewRoundOutcomeEnum,
} from '@/http/schema/types/enums/InterviewRoundEnums.js';
import type {
  InterviewRoundType,
  InterviewRoundOutcome,
} from '@/domain/interviewRound/InterviewRound.js';

const CreateInterviewRoundInput = builder.inputType('CreateInterviewRoundInput', {
  fields: (t) => ({
    applicationId: t.id({ required: true }),
    type: t.field({ type: InterviewRoundTypeEnum, required: false }),
    scheduledAt: t.string({ required: false }),
    completedAt: t.string({ required: false }),
    interviewerName: t.string({ required: false }),
    notes: t.string({ required: false }),
    outcome: t.field({ type: InterviewRoundOutcomeEnum, required: false }),
  }),
});

const UpdateInterviewRoundInput = builder.inputType('UpdateInterviewRoundInput', {
  fields: (t) => ({
    type: t.field({ type: InterviewRoundTypeEnum, required: false }),
    scheduledAt: t.string({ required: false }),
    completedAt: t.string({ required: false }),
    interviewerName: t.string({ required: false }),
    notes: t.string({ required: false }),
    outcome: t.field({ type: InterviewRoundOutcomeEnum, required: false }),
  }),
});

builder.mutationField('createInterviewRound', (t) =>
  t.field({
    type: InterviewRoundRef,
    args: {
      input: t.arg({ type: CreateInterviewRoundInput, required: true }),
    },
    resolve: async (_root, args, ctx) => {
      if (!ctx.user)
        throw new GraphQLError('Unauthorized', { extensions: { code: 'UNAUTHORIZED' } });
      const { interviewRoundResolver } = ctx.diScope.cradle;
      return interviewRoundResolver.createInterviewRound(ctx.user.sub, {
        applicationId: args.input.applicationId,
        type: (args.input.type as InterviewRoundType) ?? undefined,
        scheduledAt: args.input.scheduledAt ? new Date(args.input.scheduledAt) : undefined,
        completedAt: args.input.completedAt ? new Date(args.input.completedAt) : undefined,
        interviewerName: args.input.interviewerName ?? undefined,
        notes: args.input.notes ?? undefined,
        outcome: (args.input.outcome as InterviewRoundOutcome) ?? undefined,
      });
    },
  }),
);

builder.mutationField('updateInterviewRound', (t) =>
  t.field({
    type: InterviewRoundRef,
    args: {
      id: t.arg.id({ required: true }),
      input: t.arg({ type: UpdateInterviewRoundInput, required: true }),
    },
    resolve: async (_root, args, ctx) => {
      if (!ctx.user)
        throw new GraphQLError('Unauthorized', { extensions: { code: 'UNAUTHORIZED' } });
      const { interviewRoundResolver } = ctx.diScope.cradle;
      return interviewRoundResolver.updateInterviewRound(ctx.user.sub, args.id, {
        type: (args.input.type as InterviewRoundType) ?? undefined,
        scheduledAt:
          args.input.scheduledAt !== undefined
            ? args.input.scheduledAt
              ? new Date(args.input.scheduledAt)
              : null
            : undefined,
        completedAt:
          args.input.completedAt !== undefined
            ? args.input.completedAt
              ? new Date(args.input.completedAt)
              : null
            : undefined,
        interviewerName: args.input.interviewerName,
        notes: args.input.notes,
        outcome: (args.input.outcome as InterviewRoundOutcome) ?? undefined,
      });
    },
  }),
);

builder.mutationField('deleteInterviewRound', (t) =>
  t.field({
    type: 'Boolean',
    args: {
      id: t.arg.id({ required: true }),
    },
    resolve: async (_root, args, ctx) => {
      if (!ctx.user)
        throw new GraphQLError('Unauthorized', { extensions: { code: 'UNAUTHORIZED' } });
      const { interviewRoundResolver } = ctx.diScope.cradle;
      return interviewRoundResolver.deleteInterviewRound(ctx.user.sub, args.id);
    },
  }),
);
