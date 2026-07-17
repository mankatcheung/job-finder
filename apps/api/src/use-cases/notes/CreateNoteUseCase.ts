import type { IApplicationRepository } from '@/use-cases/ports/IApplicationRepository.js';
import type { INoteRepository } from '@/use-cases/ports/INoteRepository.js';
import type { ICreateNoteUseCase, CreateNoteInput, CreateNoteOutput } from '@/use-cases/notes/ICreateNoteUseCase.js';

interface Deps {
  applicationRepository: IApplicationRepository;
  noteRepository: INoteRepository;
  generateId: () => string;
}

export class CreateNoteUseCase implements ICreateNoteUseCase {
  constructor(private readonly deps: Deps) {}

  async execute(input: CreateNoteInput): Promise<CreateNoteOutput> {
    const app = await this.deps.applicationRepository.findById(input.applicationId);
    if (!app) {
      throw Object.assign(new Error('Application not found'), { code: 'NOT_FOUND' });
    }
    if (app.userId !== input.userId) {
      throw Object.assign(new Error('Forbidden'), { code: 'FORBIDDEN' });
    }

    return this.deps.noteRepository.create({
      id: this.deps.generateId(),
      applicationId: input.applicationId,
      content: input.content,
    });
  }
}
