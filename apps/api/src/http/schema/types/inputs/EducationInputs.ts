import { builder } from '#src/http/schema/builder.js';

export const CreateEducationInput = builder.inputType('CreateEducationInput', {
  fields: (t) => ({
    institution: t.string({ required: true }),
    degree: t.string({ required: false }),
    field: t.string({ required: false }),
    startDate: t.string({ required: true }),
    endDate: t.string({ required: false }),
    description: t.string({ required: false }),
  }),
});

export const UpdateEducationInput = builder.inputType('UpdateEducationInput', {
  fields: (t) => ({
    institution: t.string({ required: false }),
    degree: t.string({ required: false }),
    field: t.string({ required: false }),
    startDate: t.string({ required: false }),
    endDate: t.string({ required: false }),
    description: t.string({ required: false }),
  }),
});
