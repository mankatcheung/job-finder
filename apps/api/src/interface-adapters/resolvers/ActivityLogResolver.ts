import type { IGetActivityLogsUseCase } from '@/use-cases/activityLogs/IGetActivityLogsUseCase.js';
import type { GraphQLContext } from '@/http/context.js';

interface Deps {
  getActivityLogsUseCase: IGetActivityLogsUseCase;
}

export class ActivityLogResolver {
  constructor(private readonly deps: Deps) {}

  async getActivityLogs(applicationId: string, ctx: GraphQLContext) {
    if (!ctx.user) throw Object.assign(new Error('Unauthorized'), { code: 'UNAUTHORIZED' });
    return this.deps.getActivityLogsUseCase.execute({ applicationId, userId: ctx.user.sub });
  }
}
