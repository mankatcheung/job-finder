import type { ActivityLog } from '#src/domain/activityLog/ActivityLog.js';

export interface GetActivityLogsInput {
  applicationId: string;
  userId: string;
}

export type GetActivityLogsOutput = ActivityLog[];

export interface IGetActivityLogsUseCase {
  execute(input: GetActivityLogsInput): Promise<GetActivityLogsOutput>;
}
