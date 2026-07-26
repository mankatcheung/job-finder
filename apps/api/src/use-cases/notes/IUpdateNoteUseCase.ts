import type { Note } from '#src/domain/note/Note.js';

export interface UpdateNoteInput {
  userId: string;
  noteId: string;
  content: string;
}

export type UpdateNoteOutput = Note;

export interface IUpdateNoteUseCase {
  execute(input: UpdateNoteInput): Promise<UpdateNoteOutput>;
}
