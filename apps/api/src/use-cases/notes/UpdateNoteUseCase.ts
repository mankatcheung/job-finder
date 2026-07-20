import type { IApplicationRepository } from '@/use-cases/ports/IApplicationRepository.js';
import type { INoteRepository } from '@/use-cases/ports/INoteRepository.js';
import type {
  IUpdateNoteUseCase,
  UpdateNoteInput,
  UpdateNoteOutput,
} from '@/use-cases/notes/IUpdateNoteUseCase.js';

interface Deps {
  applicationRepository: IApplicationRepository;
  noteRepository: INoteRepository;
}

export class UpdateNoteUseCase implements IUpdateNoteUseCase {
  constructor(private readonly deps: Deps) {}

  async execute(input: UpdateNoteInput): Promise<UpdateNoteOutput> {
    const note = await this.deps.noteRepository.findById(input.noteId);
    if (!note) {
      throw Object.assign(new Error('Note not found'), { code: 'NOT_FOUND' });
    }

    const app = await this.deps.applicationRepository.findById(note.applicationId);
    if (!app || app.userId !== input.userId) {
      throw Object.assign(new Error('Forbidden'), { code: 'FORBIDDEN' });
    }

    return this.deps.noteRepository.update(input.noteId, input.content);
  }
}
