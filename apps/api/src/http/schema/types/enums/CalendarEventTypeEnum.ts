import { builder } from '#src/http/schema/builder.js';

export const CalendarEventTypeEnum = builder.enumType('CalendarEventType', {
  values: {
    applied: { value: 'applied' },
    followUp: { value: 'followUp' },
    interview: { value: 'interview' },
  },
});
