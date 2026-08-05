import { builder } from '#src/http/schema/builder.js';

export const CreateApplicationInput = builder.inputType('CreateApplicationInput', {
  fields: (t) => ({
    company: t.string({ required: true }),
    role: t.string({ required: true }),
    status: t.string({ required: false }),
    jobUrl: t.string({ required: false }),
    location: t.string({ required: false }),
    salaryRange: t.string({ required: false }),
    description: t.string({ required: false }),
    starred: t.boolean({ required: false }),
    source: t.string({ required: false }),
    followUpAt: t.string({ required: false }),
    tags: t.stringList({ required: false }),
  }),
});

export const UpdateApplicationInput = builder.inputType('UpdateApplicationInput', {
  fields: (t) => ({
    company: t.string({ required: false }),
    role: t.string({ required: false }),
    status: t.string({ required: false }),
    jobUrl: t.string({ required: false }),
    location: t.string({ required: false }),
    salaryRange: t.string({ required: false }),
    description: t.string({ required: false }),
    starred: t.boolean({ required: false }),
    source: t.string({ required: false }),
    followUpAt: t.string({ required: false }),
    tags: t.stringList({ required: false }),
  }),
});
