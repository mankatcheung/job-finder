import type { IApplicationRepository } from '#src/use-cases/ports/IApplicationRepository.js';
import type { IInterviewRoundRepository } from '#src/use-cases/ports/IInterviewRoundRepository.js';
import { ERROR_CODES } from '#src/constants.js';
import type {
  IGetInterviewRoundsUseCase,
  GetInterviewRoundsInput,
  GetInterviewRoundsOutput,
} from '#src/use-cases/interviewRounds/IGetInterviewRoundsUseCase.js';

interface Deps {
  applicationRepository: IApplicationRepository;
  interviewRoundRepository: IInterviewRoundRepository;
}

export class GetInterviewRoundsUseCase implements IGetInterviewRoundsUseCase {
  constructor(private readonly deps: Deps) {}

  async execute(input: GetInterviewRoundsInput): Promise<GetInterviewRoundsOutput> {
    const app = await this.deps.applicationRepository.findById(input.applicationId);
    if (!app)
      throw Object.assign(new Error('Application not found'), { code: ERROR_CODES.NOT_FOUND });
    if (app.userId !== input.userId)
      throw Object.assign(new Error('Forbidden'), { code: ERROR_CODES.FORBIDDEN });

    return this.deps.interviewRoundRepository.findAllByApplicationId(input.applicationId);
  }
}
