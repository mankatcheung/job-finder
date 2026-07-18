import type { ActivityLogDTO } from '@/interface-adapters/mappers/ActivityLogMapper.js';

export interface GetActivityLogsInput {
  applicationId: string;
  userId: string;
}

export type GetActivityLogsOutput = ActivityLogDTO[];

export interface IGetActivityLogsUseCase {
  execute(input: GetActivityLogsInput): Promise<GetActivityLogsOutput>;
}
