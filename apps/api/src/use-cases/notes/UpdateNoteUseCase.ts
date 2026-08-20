import { ForbiddenError, NotFoundError } from '#src/use-cases/errors/DomainError.js';
import type { IApplicationRepository } from '#src/use-cases/ports/IApplicationRepository.js';
import type { INoteRepository } from '#src/use-cases/ports/INoteRepository.js';
import type {
  IUpdateNoteUseCase,
  UpdateNoteInput,
  UpdateNoteOutput,
} from '#src/use-cases/notes/IUpdateNoteUseCase.js';

interface Deps {
  applicationRepository: IApplicationRepository;
  noteRepository: INoteRepository;
}

export class UpdateNoteUseCase implements IUpdateNoteUseCase {
  constructor(private readonly deps: Deps) {}

  async execute(input: UpdateNoteInput): Promise<UpdateNoteOutput> {
    const note = await this.deps.noteRepository.findById(input.noteId);
    if (!note) {
      throw new NotFoundError('Note not found');
    }

    const app = await this.deps.applicationRepository.findById(note.applicationId);
    if (!app || app.userId !== input.userId) {
      throw new ForbiddenError('Forbidden');
    }

    return this.deps.noteRepository.update(input.noteId, input.content);
  }
}
