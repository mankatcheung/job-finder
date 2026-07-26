import type { ActivityLog } from '#src/domain/activityLog/ActivityLog.js';

export type ActivityLogDTO = {
  id: string;
  applicationId: string;
  actorId: string;
  eventType: string;
  payload: string;
  createdAt: string;
};

export class ActivityLogMapper {
  toDTO(log: ActivityLog): ActivityLogDTO {
    return {
      id: log.id,
      applicationId: log.applicationId,
      actorId: log.actorId,
      eventType: log.eventType,
      payload: log.payload,
      createdAt: log.createdAt.toISOString(),
    };
  }
}
