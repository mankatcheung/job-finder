export interface DeleteNoteInput {
  userId: string;
  noteId: string;
}

export interface IDeleteNoteUseCase {
  execute(input: DeleteNoteInput): Promise<void>;
}
