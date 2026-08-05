import { builder } from '#src/http/schema/builder.js';

export const CreateSkillInput = builder.inputType('CreateSkillInput', {
  fields: (t) => ({
    name: t.string({ required: true }),
    category: t.string({ required: false }),
    proficiency: t.string({ required: false }),
  }),
});

export const UpdateSkillInput = builder.inputType('UpdateSkillInput', {
  fields: (t) => ({
    name: t.string({ required: false }),
    category: t.string({ required: false }),
    proficiency: t.string({ required: false }),
  }),
});
