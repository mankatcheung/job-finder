import type { Note } from '#src/domain/note/Note.js';

export interface CreateNoteInput {
  userId: string;
  applicationId: string;
  content: string;
}

export type CreateNoteOutput = Note;

export interface ICreateNoteUseCase {
  execute(input: CreateNoteInput): Promise<CreateNoteOutput>;
}
