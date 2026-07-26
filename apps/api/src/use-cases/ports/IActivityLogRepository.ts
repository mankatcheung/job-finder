import type { ActivityLog } from '#src/domain/activityLog/ActivityLog.js';

export interface AppendActivityLogData {
  id: string;
  applicationId: string;
  actorId: string;
  eventType: string;
  payload: string;
}

export interface IActivityLogRepository {
  findAllByApplicationId(applicationId: string): Promise<ActivityLog[]>;
  append(data: AppendActivityLogData): Promise<ActivityLog>;
}
