import { builder } from '#src/http/schema/builder.js';

export const InterviewRoundTypeEnum = builder.enumType('InterviewRoundType', {
  values: {
    phone: { value: 'phone' },
    technical: { value: 'technical' },
    onsite: { value: 'onsite' },
    hr: { value: 'hr' },
    other: { value: 'other' },
  },
});

export const InterviewRoundOutcomeEnum = builder.enumType('InterviewRoundOutcome', {
  values: {
    pending: { value: 'pending' },
    passed: { value: 'passed' },
    failed: { value: 'failed' },
    cancelled: { value: 'cancelled' },
  },
});
