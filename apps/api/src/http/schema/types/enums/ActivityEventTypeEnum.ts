import { builder } from '#src/http/schema/builder.js';

export const ActivityEventTypeEnum = builder.enumType('ActivityEventType', {
  values: [
    'status_changed',
    'note_added',
    'note_deleted',
    'document_uploaded',
    'document_deleted',
    'interview_added',
    'field_updated',
  ] as const,
});
