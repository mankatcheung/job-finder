import { ForbiddenError, NotFoundError } from '#src/use-cases/errors/DomainError.js';
import type { IApplicationRepository } from '#src/use-cases/ports/IApplicationRepository.js';
import type { INoteRepository } from '#src/use-cases/ports/INoteRepository.js';
import type { IActivityLogRepository } from '#src/use-cases/ports/IActivityLogRepository.js';
import type {
  IDeleteNoteUseCase,
  DeleteNoteInput,
} from '#src/use-cases/notes/IDeleteNoteUseCase.js';

interface Deps {
  applicationRepository: IApplicationRepository;
  noteRepository: INoteRepository;
  activityLogRepository?: IActivityLogRepository;
  generateId?: () => string;
}

export class DeleteNoteUseCase implements IDeleteNoteUseCase {
  constructor(private readonly deps: Deps) {}

  async execute(input: DeleteNoteInput): Promise<void> {
    const note = await this.deps.noteRepository.findById(input.noteId);
    if (!note) {
      throw new NotFoundError('Note not found');
    }

    const app = await this.deps.applicationRepository.findById(note.applicationId);
    if (!app || app.userId !== input.userId) {
      throw new ForbiddenError('Forbidden');
    }

    await this.deps.noteRepository.delete(input.noteId, note.applicationId);

    if (this.deps.activityLogRepository && this.deps.generateId)
      await this.deps.activityLogRepository.append({
        id: this.deps.generateId(),
        applicationId: note.applicationId,
        actorId: input.userId,
        eventType: 'note_deleted',
        payload: JSON.stringify({ noteId: input.noteId }),
      });
  }
}
