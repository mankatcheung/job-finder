import type { IApplicationRepository } from '@/use-cases/ports/IApplicationRepository.js';
import type { IActivityLogRepository } from '@/use-cases/ports/IActivityLogRepository.js';
import type { ITransactionManager } from '@/use-cases/ports/ITransactionManager.js';
import { ERROR_CODES } from '@/constants.js';
import type {
  IUpdateApplicationUseCase,
  UpdateApplicationInput,
  UpdateApplicationOutput,
} from '@/use-cases/jobs/IUpdateApplicationUseCase.js';

interface Deps {
  applicationRepository: IApplicationRepository;
  activityLogRepository?: IActivityLogRepository;
  generateId?: () => string;
  transactionManager?: ITransactionManager;
}

export class UpdateApplicationUseCase implements IUpdateApplicationUseCase {
  constructor(private readonly deps: Deps) {}

  async execute(input: UpdateApplicationInput): Promise<UpdateApplicationOutput> {
    const app = await this.deps.applicationRepository.findById(input.applicationId);
    if (!app) {
      throw Object.assign(new Error('Application not found'), { code: ERROR_CODES.NOT_FOUND });
    }
    if (app.userId !== input.userId) {
      throw Object.assign(new Error('Forbidden'), { code: ERROR_CODES.FORBIDDEN });
    }

    const appliedAt = input.status === 'applied' && app.appliedAt === null ? new Date() : undefined;

    const doUpdate = async () => {
      const updated = await this.deps.applicationRepository.update(input.applicationId, {
        company: input.company,
        role: input.role,
        status: input.status,
        jobUrl: input.jobUrl,
        location: input.location,
        salaryRange: input.salaryRange,
        description: input.description,
        starred: input.starred,
        source: input.source,
        followUpAt: input.followUpAt,
        tags: input.tags,
        ...(appliedAt !== undefined ? { appliedAt } : {}),
      });

      if (this.deps.activityLogRepository && this.deps.generateId) {
        const genId = this.deps.generateId;
        if (input.status !== undefined && input.status !== app.status) {
          await this.deps.activityLogRepository.append({
            id: genId(),
            applicationId: input.applicationId,
            actorId: input.userId,
            eventType: 'status_changed',
            payload: JSON.stringify({ from: app.status, to: input.status }),
          });
        } else {
          const primitiveFields = [
            'company',
            'role',
            'jobUrl',
            'location',
            'salaryRange',
            'description',
            'source',
            'starred',
          ] as const;

          const changed: string[] = primitiveFields.filter(
            (f) => input[f] !== undefined && input[f] !== app[f],
          );

          if (input.followUpAt !== undefined) {
            const nextTime = input.followUpAt ? input.followUpAt.getTime() : null;
            const prevTime = app.followUpAt ? app.followUpAt.getTime() : null;
            if (nextTime !== prevTime) {
              changed.push('followUpAt');
            }
          }

          if (changed.length > 0) {
            await this.deps.activityLogRepository.append({
              id: genId(),
              applicationId: input.applicationId,
              actorId: input.userId,
              eventType: 'field_updated',
              payload: JSON.stringify({ fields: changed }),
            });
          }
        }
      }

      return updated;
    };

    return this.deps.transactionManager ? this.deps.transactionManager.run(doUpdate) : doUpdate();
  }
}
