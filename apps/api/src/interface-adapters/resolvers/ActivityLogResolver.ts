import type { IGetActivityLogsUseCase } from '#src/use-cases/activityLogs/IGetActivityLogsUseCase.js';
import type {
  ActivityLogMapper,
  ActivityLogDTO,
} from '#src/interface-adapters/mappers/ActivityLogMapper.js';

interface Deps {
  getActivityLogsUseCase: IGetActivityLogsUseCase;
  activityLogMapper: ActivityLogMapper;
}

export class ActivityLogResolver {
  constructor(private readonly deps: Deps) {}

  async getActivityLogs(userId: string, applicationId: string): Promise<ActivityLogDTO[]> {
    const logs = await this.deps.getActivityLogsUseCase.execute({ applicationId, userId });
    return logs.map((l) => this.deps.activityLogMapper.toDTO(l));
  }
}
