import type { IApplicationRepository } from '@/use-cases/ports/IApplicationRepository.js';
import type { IActivityLogRepository } from '@/use-cases/ports/IActivityLogRepository.js';
import type { IUpdateApplicationUseCase, UpdateApplicationInput, UpdateApplicationOutput } from '@/use-cases/jobs/IUpdateApplicationUseCase.js';

interface Deps {
  applicationRepository: IApplicationRepository;
  activityLogRepository?: IActivityLogRepository;
  generateId?: () => string;
}

export class UpdateApplicationUseCase implements IUpdateApplicationUseCase {
  constructor(private readonly deps: Deps) {}

  async execute(input: UpdateApplicationInput): Promise<UpdateApplicationOutput> {
    const app = await this.deps.applicationRepository.findById(input.applicationId);
    if (!app) {
      throw Object.assign(new Error('Application not found'), { code: 'NOT_FOUND' });
    }
    if (app.userId !== input.userId) {
      throw Object.assign(new Error('Forbidden'), { code: 'FORBIDDEN' });
    }

    const appliedAt = input.status === 'applied' && app.appliedAt === null ? new Date() : undefined;

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
        const changed = (['company', 'role', 'jobUrl', 'location', 'salaryRange', 'description', 'source', 'followUpAt', 'starred'] as const).filter(
          (f) => input[f as keyof typeof input] !== undefined,
        );
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
  }
}
