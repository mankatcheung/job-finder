import type { IApplicationRepository } from '@/use-cases/ports/IApplicationRepository.js';
import type { IActivityLogRepository } from '@/use-cases/ports/IActivityLogRepository.js';
import { ERROR_CODES } from '@/constants.js';
import type {
  IGetActivityLogsUseCase,
  GetActivityLogsInput,
  GetActivityLogsOutput,
} from '@/use-cases/activityLogs/IGetActivityLogsUseCase.js';

interface Deps {
  applicationRepository: IApplicationRepository;
  activityLogRepository: IActivityLogRepository;
}

export class GetActivityLogsUseCase implements IGetActivityLogsUseCase {
  constructor(private readonly deps: Deps) {}

  async execute(input: GetActivityLogsInput): Promise<GetActivityLogsOutput> {
    const app = await this.deps.applicationRepository.findById(input.applicationId);
    if (!app)
      throw Object.assign(new Error('Application not found'), { code: ERROR_CODES.NOT_FOUND });
    if (app.userId !== input.userId)
      throw Object.assign(new Error('Forbidden'), { code: ERROR_CODES.FORBIDDEN });

    return this.deps.activityLogRepository.findAllByApplicationId(input.applicationId);
  }
}
