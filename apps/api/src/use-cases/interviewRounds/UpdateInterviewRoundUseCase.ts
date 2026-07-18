import type { IApplicationRepository } from '@/use-cases/ports/IApplicationRepository.js';
import type { IInterviewRoundRepository } from '@/use-cases/ports/IInterviewRoundRepository.js';
import type {
  IUpdateInterviewRoundUseCase,
  UpdateInterviewRoundInput,
  UpdateInterviewRoundOutput,
} from '@/use-cases/interviewRounds/IUpdateInterviewRoundUseCase.js';

interface Deps {
  applicationRepository: IApplicationRepository;
  interviewRoundRepository: IInterviewRoundRepository;
}

export class UpdateInterviewRoundUseCase implements IUpdateInterviewRoundUseCase {
  constructor(private readonly deps: Deps) {}

  async execute(input: UpdateInterviewRoundInput): Promise<UpdateInterviewRoundOutput> {
    const round = await this.deps.interviewRoundRepository.findById(input.roundId);
    if (!round) throw Object.assign(new Error('Interview round not found'), { code: 'NOT_FOUND' });

    const app = await this.deps.applicationRepository.findById(round.applicationId);
    if (!app || app.userId !== input.userId)
      throw Object.assign(new Error('Forbidden'), { code: 'FORBIDDEN' });

    return this.deps.interviewRoundRepository.update(input.roundId, {
      type: input.type,
      scheduledAt: input.scheduledAt,
      completedAt: input.completedAt,
      interviewerName: input.interviewerName,
      notes: input.notes,
      outcome: input.outcome,
    });
  }
}
