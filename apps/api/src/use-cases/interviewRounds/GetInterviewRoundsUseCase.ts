import { ForbiddenError, NotFoundError } from '#src/use-cases/errors/DomainError.js';
import type { IApplicationRepository } from '#src/use-cases/ports/IApplicationRepository.js';
import type { IInterviewRoundRepository } from '#src/use-cases/ports/IInterviewRoundRepository.js';
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
    if (!app) throw new NotFoundError('Application not found');
    if (app.userId !== input.userId) throw new ForbiddenError('Forbidden');

    return this.deps.interviewRoundRepository.findAllByApplicationId(input.applicationId);
  }
}
