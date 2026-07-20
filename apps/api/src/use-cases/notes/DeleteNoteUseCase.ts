import type { IApplicationRepository } from '@/use-cases/ports/IApplicationRepository.js';
import type { INoteRepository } from '@/use-cases/ports/INoteRepository.js';
import type { IActivityLogRepository } from '@/use-cases/ports/IActivityLogRepository.js';
import type { IDeleteNoteUseCase, DeleteNoteInput } from '@/use-cases/notes/IDeleteNoteUseCase.js';

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
      throw Object.assign(new Error('Note not found'), { code: 'NOT_FOUND' });
    }

    const app = await this.deps.applicationRepository.findById(note.applicationId);
    if (!app || app.userId !== input.userId) {
      throw Object.assign(new Error('Forbidden'), { code: 'FORBIDDEN' });
    }

    await this.deps.noteRepository.delete(input.noteId);

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
