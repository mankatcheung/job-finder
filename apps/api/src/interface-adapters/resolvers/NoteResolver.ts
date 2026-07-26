import type { ICreateNoteUseCase } from '#src/use-cases/notes/ICreateNoteUseCase.js';
import type { IGetNotesUseCase } from '#src/use-cases/notes/IGetNotesUseCase.js';
import type { IUpdateNoteUseCase } from '#src/use-cases/notes/IUpdateNoteUseCase.js';
import type { IDeleteNoteUseCase } from '#src/use-cases/notes/IDeleteNoteUseCase.js';
import type { NoteMapper, NoteDTO } from '#src/interface-adapters/mappers/NoteMapper.js';

interface Deps {
  createNoteUseCase: ICreateNoteUseCase;
  getNotesUseCase: IGetNotesUseCase;
  updateNoteUseCase: IUpdateNoteUseCase;
  deleteNoteUseCase: IDeleteNoteUseCase;
  noteMapper: NoteMapper;
}

export class NoteResolver {
  constructor(private readonly deps: Deps) {}

  async getNotes(userId: string, applicationId: string): Promise<NoteDTO[]> {
    const notes = await this.deps.getNotesUseCase.execute({ userId, applicationId });
    return notes.map((n) => this.deps.noteMapper.toDTO(n));
  }

  async createNote(userId: string, applicationId: string, content: string): Promise<NoteDTO> {
    const note = await this.deps.createNoteUseCase.execute({ userId, applicationId, content });
    return this.deps.noteMapper.toDTO(note);
  }

  async updateNote(userId: string, noteId: string, content: string): Promise<NoteDTO> {
    const note = await this.deps.updateNoteUseCase.execute({ userId, noteId, content });
    return this.deps.noteMapper.toDTO(note);
  }

  async deleteNote(userId: string, noteId: string): Promise<boolean> {
    await this.deps.deleteNoteUseCase.execute({ userId, noteId });
    return true;
  }
}
