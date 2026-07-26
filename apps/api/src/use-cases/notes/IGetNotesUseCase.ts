import type { Note } from '#src/domain/note/Note.js';

export interface GetNotesInput {
  userId: string;
  applicationId: string;
}

export type GetNotesOutput = Note[];

export interface IGetNotesUseCase {
  execute(input: GetNotesInput): Promise<GetNotesOutput>;
}
