import { builder } from '@/http/schema/builder.js';
import { ApplicationStatusEnum } from '@/http/schema/types/enums/ApplicationStatusEnum.js';

export const CreateApplicationInput = builder.inputType('CreateApplicationInput', {
  fields: (t) => ({
    company: t.string({ required: true }),
    role: t.string({ required: true }),
    status: t.field({ type: ApplicationStatusEnum, required: false }),
    jobUrl: t.string({ required: false }),
    location: t.string({ required: false }),
    salaryRange: t.string({ required: false }),
    description: t.string({ required: false }),
    starred: t.boolean({ required: false }),
    source: t.string({ required: false }),
    followUpAt: t.string({ required: false }),
  }),
});

export const UpdateApplicationInput = builder.inputType('UpdateApplicationInput', {
  fields: (t) => ({
    company: t.string({ required: false }),
    role: t.string({ required: false }),
    status: t.field({ type: ApplicationStatusEnum, required: false }),
    jobUrl: t.string({ required: false }),
    location: t.string({ required: false }),
    salaryRange: t.string({ required: false }),
    description: t.string({ required: false }),
    starred: t.boolean({ required: false }),
    source: t.string({ required: false }),
    followUpAt: t.string({ required: false }),
  }),
});
