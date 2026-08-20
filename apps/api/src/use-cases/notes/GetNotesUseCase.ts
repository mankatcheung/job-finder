import { ForbiddenError, NotFoundError } from '#src/use-cases/errors/DomainError.js';
import type { IApplicationRepository } from '#src/use-cases/ports/IApplicationRepository.js';
import type { INoteRepository } from '#src/use-cases/ports/INoteRepository.js';
import type {
  IGetNotesUseCase,
  GetNotesInput,
  GetNotesOutput,
} from '#src/use-cases/notes/IGetNotesUseCase.js';

interface Deps {
  applicationRepository: IApplicationRepository;
  noteRepository: INoteRepository;
}

export class GetNotesUseCase implements IGetNotesUseCase {
  constructor(private readonly deps: Deps) {}

  async execute(input: GetNotesInput): Promise<GetNotesOutput> {
    const app = await this.deps.applicationRepository.findById(input.applicationId);
    if (!app) {
      throw new NotFoundError('Application not found');
    }
    if (app.userId !== input.userId) {
      throw new ForbiddenError('Forbidden');
    }

    return this.deps.noteRepository.findAllByApplicationId(input.applicationId);
  }
}
