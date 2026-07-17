import { builder } from '@/http/schema/builder.js';
import { APPLICATION_STATUSES } from '@/domain/application/ApplicationStatus.js';

export const ApplicationStatusEnum = builder.enumType('ApplicationStatus', {
  values: Object.fromEntries(APPLICATION_STATUSES.map((s) => [s, { value: s }])) as Record<
    (typeof APPLICATION_STATUSES)[number],
    { value: string }
  >,
});
