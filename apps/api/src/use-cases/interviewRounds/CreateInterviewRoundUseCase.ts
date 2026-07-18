import type { IApplicationRepository } from '@/use-cases/ports/IApplicationRepository.js';
import type { IInterviewRoundRepository } from '@/use-cases/ports/IInterviewRoundRepository.js';
import type {
  ICreateInterviewRoundUseCase,
  CreateInterviewRoundInput,
  CreateInterviewRoundOutput,
} from '@/use-cases/interviewRounds/ICreateInterviewRoundUseCase.js';

interface Deps {
  applicationRepository: IApplicationRepository;
  interviewRoundRepository: IInterviewRoundRepository;
  generateId: () => string;
}

export class CreateInterviewRoundUseCase implements ICreateInterviewRoundUseCase {
  constructor(private readonly deps: Deps) {}

  async execute(input: CreateInterviewRoundInput): Promise<CreateInterviewRoundOutput> {
    const app = await this.deps.applicationRepository.findById(input.applicationId);
    if (!app) throw Object.assign(new Error('Application not found'), { code: 'NOT_FOUND' });
    if (app.userId !== input.userId) throw Object.assign(new Error('Forbidden'), { code: 'FORBIDDEN' });

    return this.deps.interviewRoundRepository.create({
      id: this.deps.generateId(),
      applicationId: input.applicationId,
      type: input.type ?? 'other',
      scheduledAt: input.scheduledAt ?? null,
      completedAt: input.completedAt ?? null,
      interviewerName: input.interviewerName ?? null,
      notes: input.notes ?? null,
      outcome: input.outcome ?? 'pending',
    });
  }
}
