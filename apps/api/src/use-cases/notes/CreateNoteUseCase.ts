import type { IApplicationRepository } from '#src/use-cases/ports/IApplicationRepository.js';
import type { INoteRepository } from '#src/use-cases/ports/INoteRepository.js';
import type { IActivityLogRepository } from '#src/use-cases/ports/IActivityLogRepository.js';
import { ERROR_CODES } from '#src/constants.js';
import type {
  ICreateNoteUseCase,
  CreateNoteInput,
  CreateNoteOutput,
} from '#src/use-cases/notes/ICreateNoteUseCase.js';

interface Deps {
  applicationRepository: IApplicationRepository;
  noteRepository: INoteRepository;
  activityLogRepository?: IActivityLogRepository;
  generateId: () => string;
}

export class CreateNoteUseCase implements ICreateNoteUseCase {
  constructor(private readonly deps: Deps) {}

  async execute(input: CreateNoteInput): Promise<CreateNoteOutput> {
    const app = await this.deps.applicationRepository.findById(input.applicationId);
    if (!app) {
      throw Object.assign(new Error('Application not found'), { code: ERROR_CODES.NOT_FOUND });
    }
    if (app.userId !== input.userId) {
      throw Object.assign(new Error('Forbidden'), { code: ERROR_CODES.FORBIDDEN });
    }

    const note = await this.deps.noteRepository.create({
      id: this.deps.generateId(),
      applicationId: input.applicationId,
      content: input.content,
    });

    await this.deps.activityLogRepository?.append({
      id: this.deps.generateId(),
      applicationId: input.applicationId,
      actorId: input.userId,
      eventType: 'note_added',
      payload: JSON.stringify({ noteId: note.id }),
    });

    return note;
  }
}
