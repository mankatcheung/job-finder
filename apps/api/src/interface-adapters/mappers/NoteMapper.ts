import type { Note } from '#src/domain/note/Note.js';

export interface NoteDTO {
  id: string;
  applicationId: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export class NoteMapper {
  toDTO(note: Note): NoteDTO {
    return {
      id: note.id,
      applicationId: note.applicationId,
      content: note.content,
      createdAt: note.createdAt.toISOString(),
      updatedAt: note.updatedAt.toISOString(),
    };
  }
}
