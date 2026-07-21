import type { IApplicationRepository } from '@/use-cases/ports/IApplicationRepository.js';
import type { INoteRepository } from '@/use-cases/ports/INoteRepository.js';
import { ERROR_CODES } from '@/constants.js';
import type {
  IGetNotesUseCase,
  GetNotesInput,
  GetNotesOutput,
} from '@/use-cases/notes/IGetNotesUseCase.js';

interface Deps {
  applicationRepository: IApplicationRepository;
  noteRepository: INoteRepository;
}

export class GetNotesUseCase implements IGetNotesUseCase {
  constructor(private readonly deps: Deps) {}

  async execute(input: GetNotesInput): Promise<GetNotesOutput> {
    const app = await this.deps.applicationRepository.findById(input.applicationId);
    if (!app) {
      throw Object.assign(new Error('Application not found'), { code: ERROR_CODES.NOT_FOUND });
    }
    if (app.userId !== input.userId) {
      throw Object.assign(new Error('Forbidden'), { code: ERROR_CODES.FORBIDDEN });
    }

    return this.deps.noteRepository.findAllByApplicationId(input.applicationId);
  }
}
