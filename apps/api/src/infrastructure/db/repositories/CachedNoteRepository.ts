import type { Note } from '#src/domain/note/Note.js';
import type { INoteRepository } from '#src/use-cases/ports/INoteRepository.js';
import type { ICache } from '#src/infrastructure/cache/ICache.js';
import { BoundedMap } from '#src/infrastructure/cache/BoundedMap.js';
import { CACHE, CACHE_KEYS } from '#src/constants.js';

interface Deps {
  drizzleNoteRepository: INoteRepository;
  cache: ICache;
}

export class CachedNoteRepository implements INoteRepository {
  // Tracks which applicationId owns each note so delete() can invalidate the right list.
  private readonly appIdByNoteId = new BoundedMap<string, string>(CACHE.REVERSE_INDEX_MAX_ENTRIES);
  private readonly inner: INoteRepository;
  private readonly cache: ICache;

  constructor({ drizzleNoteRepository, cache }: Deps) {
    this.inner = drizzleNoteRepository;
    this.cache = cache;
  }

  async findAllByApplicationId(applicationId: string): Promise<Note[]> {
    const key = CACHE_KEYS.noteList(applicationId);
    const result = await this.cache.getOrSet(key, () =>
      this.inner.findAllByApplicationId(applicationId),
    );
    for (const note of result) this.appIdByNoteId.set(note.id, note.applicationId);
    return result;
  }

  /**
   * Not cached, matching `CachedDocumentRepository.countByApplicationId`.
   *
   * Not for want of an eviction point — create/update/delete already evict the
   * list key and could evict a count key beside it. It is that `delete()` can
   * only evict a list when the reverse index still holds the owning
   * applicationId, so each cached key is another one that can silently miss;
   * a single COUNT(*) is not worth adding to that set.
   */
  async countByApplicationId(applicationId: string): Promise<number> {
    return this.inner.countByApplicationId(applicationId);
  }

  async findById(id: string): Promise<Note | null> {
    const key = CACHE_KEYS.noteById(id);
    const result = await this.cache.getOrSet(key, () => this.inner.findById(id));
    if (result) this.appIdByNoteId.set(id, result.applicationId);
    return result;
  }

  async create(data: { id: string; applicationId: string; content: string }): Promise<Note> {
    const result = await this.inner.create(data);
    this.appIdByNoteId.set(result.id, result.applicationId);
    await this.cache.delete(CACHE_KEYS.noteList(result.applicationId));
    return result;
  }

  async update(id: string, content: string): Promise<Note> {
    const result = await this.inner.update(id, content);
    await this.cache.delete(CACHE_KEYS.noteById(id));
    await this.cache.delete(CACHE_KEYS.noteList(result.applicationId));
    this.appIdByNoteId.set(id, result.applicationId);
    return result;
  }

  async delete(id: string): Promise<void> {
    const applicationId = this.appIdByNoteId.get(id);
    await this.inner.delete(id);
    await this.cache.delete(CACHE_KEYS.noteById(id));
    this.appIdByNoteId.delete(id);
    if (applicationId) await this.cache.delete(CACHE_KEYS.noteList(applicationId));
  }
}
