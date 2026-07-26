import type { IApplicationRepository } from '#src/use-cases/ports/IApplicationRepository.js';
import type {
  IGetApplicationsUseCase,
  GetApplicationsInput,
  GetApplicationsOutput,
} from '#src/use-cases/jobs/IGetApplicationsUseCase.js';

interface Deps {
  applicationRepository: IApplicationRepository;
}

export class GetApplicationsUseCase implements IGetApplicationsUseCase {
  constructor(private readonly deps: Deps) {}

  async execute(input: GetApplicationsInput): Promise<GetApplicationsOutput> {
    return this.deps.applicationRepository.findAllByUserId(input.userId, {
      status: input.status,
    });
  }
}
