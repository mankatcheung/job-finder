export type ActivityEventType =
  | 'status_changed'
  | 'note_added'
  | 'note_deleted'
  | 'document_uploaded'
  | 'document_deleted'
  | 'interview_added'
  | 'field_updated';

export type ActivityLog = {
  id: string;
  applicationId: string;
  actorId: string;
  eventType: ActivityEventType;
  payload: string;
  createdAt: Date;
};
