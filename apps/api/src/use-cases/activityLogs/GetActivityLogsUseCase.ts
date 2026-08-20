import { ForbiddenError, NotFoundError } from '#src/use-cases/errors/DomainError.js';
import type { IApplicationRepository } from '#src/use-cases/ports/IApplicationRepository.js';
import type { IActivityLogRepository } from '#src/use-cases/ports/IActivityLogRepository.js';
import type {
  IGetActivityLogsUseCase,
  GetActivityLogsInput,
  GetActivityLogsOutput,
} from '#src/use-cases/activityLogs/IGetActivityLogsUseCase.js';

interface Deps {
  applicationRepository: IApplicationRepository;
  activityLogRepository: IActivityLogRepository;
}

export class GetActivityLogsUseCase implements IGetActivityLogsUseCase {
  constructor(private readonly deps: Deps) {}

  async execute(input: GetActivityLogsInput): Promise<GetActivityLogsOutput> {
    const app = await this.deps.applicationRepository.findById(input.applicationId);
    if (!app) throw new NotFoundError('Application not found');
    if (app.userId !== input.userId) throw new ForbiddenError('Forbidden');

    return this.deps.activityLogRepository.findAllByApplicationId(input.applicationId);
  }
}
