import type { IGetActivityLogsUseCase } from '@/use-cases/activityLogs/IGetActivityLogsUseCase.js';
import type { GraphQLContext } from '@/http/context.js';
import type {
  ActivityLogMapper,
  ActivityLogDTO,
} from '@/interface-adapters/mappers/ActivityLogMapper.js';

interface Deps {
  getActivityLogsUseCase: IGetActivityLogsUseCase;
  activityLogMapper: ActivityLogMapper;
}

export class ActivityLogResolver {
  constructor(private readonly deps: Deps) {}

  async getActivityLogs(applicationId: string, ctx: GraphQLContext): Promise<ActivityLogDTO[]> {
    if (!ctx.user) throw Object.assign(new Error('Unauthorized'), { code: 'UNAUTHORIZED' });
    const logs = await this.deps.getActivityLogsUseCase.execute({
      applicationId,
      userId: ctx.user.sub,
    });
    return logs.map((l) => this.deps.activityLogMapper.toDTO(l));
  }
}
