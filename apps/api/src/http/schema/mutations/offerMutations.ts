import { GraphQLError } from 'graphql';
import { builder } from '#src/http/schema/builder.js';
import { OfferRef, OfferComparisonRef } from '#src/http/schema/types/OfferType.js';
import { ERROR_CODES } from '#src/constants.js';

const CreateOfferInput = builder.inputType('CreateOfferInput', {
  fields: (t) => ({
    applicationId: t.id({ required: true }),
    baseSalary: t.int({ required: true }),
    bonus: t.int({ required: false }),
    equity: t.string({ required: false }),
    benefits: t.string({ required: false }),
    costOfLivingAdjustment: t.int({ required: false }),
    currency: t.string({ required: false, defaultValue: 'USD' }),
    period: t.string({ required: false, defaultValue: 'yearly' }),
    notes: t.string({ required: false }),
  }),
});

const UpdateOfferInput = builder.inputType('UpdateOfferInput', {
  fields: (t) => ({
    offerId: t.id({ required: true }),
    baseSalary: t.int({ required: false }),
    bonus: t.int({ required: false }),
    equity: t.string({ required: false }),
    benefits: t.string({ required: false }),
    costOfLivingAdjustment: t.int({ required: false }),
    currency: t.string({ required: false }),
    period: t.string({ required: false }),
    notes: t.string({ required: false }),
  }),
});

builder.mutationField('createOffer', (t) =>
  t.field({
    type: OfferRef,
    args: {
      input: t.arg({ type: CreateOfferInput, required: true }),
    },
    resolve: async (_root, args, ctx) => {
      if (!ctx.user)
        throw new GraphQLError('Unauthorized', { extensions: { code: ERROR_CODES.UNAUTHORIZED } });
      const resolver = ctx.diScope.cradle.offerResolver;
      return resolver.createOffer(ctx.user.sub, {
        applicationId: args.input.applicationId,
        baseSalary: args.input.baseSalary,
        bonus: args.input.bonus ?? undefined,
        equity: args.input.equity ?? undefined,
        benefits: args.input.benefits ?? undefined,
        costOfLivingAdjustment: args.input.costOfLivingAdjustment ?? undefined,
        currency: args.input.currency ?? undefined,
        period: args.input.period ?? undefined,
        notes: args.input.notes ?? undefined,
      });
    },
  }),
);

builder.mutationField('updateOffer', (t) =>
  t.field({
    type: OfferRef,
    args: {
      input: t.arg({ type: UpdateOfferInput, required: true }),
    },
    resolve: async (_root, args, ctx) => {
      if (!ctx.user)
        throw new GraphQLError('Unauthorized', { extensions: { code: ERROR_CODES.UNAUTHORIZED } });
      const resolver = ctx.diScope.cradle.offerResolver;
      return resolver.updateOffer(ctx.user.sub, {
        offerId: args.input.offerId,
        baseSalary: args.input.baseSalary ?? undefined,
        bonus: args.input.bonus ?? undefined,
        equity: args.input.equity ?? undefined,
        benefits: args.input.benefits ?? undefined,
        costOfLivingAdjustment: args.input.costOfLivingAdjustment ?? undefined,
        currency: args.input.currency ?? undefined,
        period: args.input.period ?? undefined,
        notes: args.input.notes ?? undefined,
      });
    },
  }),
);

builder.mutationField('deleteOffer', (t) =>
  t.field({
    type: 'Boolean',
    args: {
      id: t.arg.string({ required: true }),
    },
    resolve: async (_root, args, ctx) => {
      if (!ctx.user)
        throw new GraphQLError('Unauthorized', { extensions: { code: ERROR_CODES.UNAUTHORIZED } });
      const resolver = ctx.diScope.cradle.offerResolver;
      await resolver.deleteOffer(ctx.user.sub, args.id);
      return true;
    },
  }),
);

builder.mutationField('compareOffers', (t) =>
  t.field({
    type: [OfferComparisonRef],
    args: {
      offerIds: t.arg.stringList({ required: true }),
    },
    resolve: async (_root, args, ctx) => {
      if (!ctx.user)
        throw new GraphQLError('Unauthorized', { extensions: { code: ERROR_CODES.UNAUTHORIZED } });
      const resolver = ctx.diScope.cradle.offerResolver;
      return resolver.compareOffers(ctx.user.sub, args.offerIds);
    },
  }),
);
