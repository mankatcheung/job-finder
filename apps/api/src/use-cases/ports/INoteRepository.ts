import type { Note } from '#src/domain/note/Note.js';

export interface INoteRepository {
  findAllByApplicationId(applicationId: string): Promise<Note[]>;
  countByApplicationId(applicationId: string): Promise<number>;
  findById(id: string): Promise<Note | null>;
  create(data: { id: string; applicationId: string; content: string }): Promise<Note>;
  update(id: string, content: string): Promise<Note>;
  delete(id: string): Promise<void>;
}
