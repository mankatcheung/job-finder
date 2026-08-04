import { builder } from '#src/http/schema/builder.js';

export const CreateWorkExperienceInput = builder.inputType('CreateWorkExperienceInput', {
  fields: (t) => ({
    company: t.string({ required: true }),
    title: t.string({ required: true }),
    location: t.string({ required: false }),
    startDate: t.string({ required: true }),
    endDate: t.string({ required: false }),
    description: t.string({ required: false }),
  }),
});

export const UpdateWorkExperienceInput = builder.inputType('UpdateWorkExperienceInput', {
  fields: (t) => ({
    company: t.string({ required: false }),
    title: t.string({ required: false }),
    location: t.string({ required: false }),
    startDate: t.string({ required: false }),
    endDate: t.string({ required: false }),
    description: t.string({ required: false }),
  }),
});
