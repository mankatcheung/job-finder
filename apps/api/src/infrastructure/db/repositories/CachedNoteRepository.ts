import type { Note } from '#src/domain/note/Note.js';
import type { INoteRepository } from '#src/use-cases/ports/INoteRepository.js';
import type { ICache } from '#src/infrastructure/cache/ICache.js';
import { CACHE_KEYS } from '#src/constants.js';

interface Deps {
  drizzleNoteRepository: INoteRepository;
  cache: ICache;
}

export class CachedNoteRepository implements INoteRepository {
  private readonly inner: INoteRepository;
  private readonly cache: ICache;

  constructor({ drizzleNoteRepository, cache }: Deps) {
    this.inner = drizzleNoteRepository;
    this.cache = cache;
  }

  async findAllByApplicationId(applicationId: string): Promise<Note[]> {
    const key = CACHE_KEYS.noteList(applicationId);
    return this.cache.getOrSet(key, () => this.inner.findAllByApplicationId(applicationId));
  }

  /**
   * Not cached, matching `CachedDocumentRepository.countByApplicationId`. A
   * single COUNT(*) isn't worth a dedicated cache key and invalidation path.
   */
  async countByApplicationId(applicationId: string): Promise<number> {
    return this.inner.countByApplicationId(applicationId);
  }

  async findById(id: string): Promise<Note | null> {
    const key = CACHE_KEYS.noteById(id);
    return this.cache.getOrSet(key, () => this.inner.findById(id));
  }

  async create(data: { id: string; applicationId: string; content: string }): Promise<Note> {
    const result = await this.inner.create(data);
    await this.cache.delete(CACHE_KEYS.noteList(result.applicationId));
    return result;
  }

  async update(id: string, content: string): Promise<Note> {
    const result = await this.inner.update(id, content);
    await this.cache.delete(CACHE_KEYS.noteById(id));
    await this.cache.delete(CACHE_KEYS.noteList(result.applicationId));
    return result;
  }

  async delete(id: string, applicationId: string): Promise<void> {
    await this.inner.delete(id, applicationId);
    await this.cache.delete(CACHE_KEYS.noteById(id));
    await this.cache.delete(CACHE_KEYS.noteList(applicationId));
  }
}
