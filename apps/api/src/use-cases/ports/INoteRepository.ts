import type { Note } from '#src/domain/note/Note.js';

export interface INoteRepository {
  findAllByApplicationId(applicationId: string): Promise<Note[]>;
  countByApplicationId(applicationId: string): Promise<number>;
  findById(id: string): Promise<Note | null>;
  create(data: { id: string; applicationId: string; content: string }): Promise<Note>;
  update(id: string, content: string): Promise<Note>;
  delete(id: string, applicationId: string): Promise<void>;
  /**
   * The user's most recent notes on applications *other than* `excludeApplicationId`
   * (JEF-249) — backs the opt-in cross-application context fed into cover
   * letter generation. Excludes trashed applications, same as every other
   * read path.
   */
  findRecentByUserExcludingApplication(
    userId: string,
    excludeApplicationId: string,
    limit: number,
  ): Promise<Note[]>;
}
