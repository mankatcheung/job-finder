import type { IApplicationRepository } from '#src/use-cases/ports/IApplicationRepository.js';
import type { IInterviewRoundRepository } from '#src/use-cases/ports/IInterviewRoundRepository.js';
import { ERROR_CODES } from '#src/constants.js';
import type {
  IDeleteInterviewRoundUseCase,
  DeleteInterviewRoundInput,
} from '#src/use-cases/interviewRounds/IDeleteInterviewRoundUseCase.js';

interface Deps {
  applicationRepository: IApplicationRepository;
  interviewRoundRepository: IInterviewRoundRepository;
}

export class DeleteInterviewRoundUseCase implements IDeleteInterviewRoundUseCase {
  constructor(private readonly deps: Deps) {}

  async execute(input: DeleteInterviewRoundInput): Promise<void> {
    const round = await this.deps.interviewRoundRepository.findById(input.roundId);
    if (!round)
      throw Object.assign(new Error('Interview round not found'), { code: ERROR_CODES.NOT_FOUND });

    const app = await this.deps.applicationRepository.findById(round.applicationId);
    if (!app || app.userId !== input.userId)
      throw Object.assign(new Error('Forbidden'), { code: ERROR_CODES.FORBIDDEN });

    await this.deps.interviewRoundRepository.delete(input.roundId);
  }
}
