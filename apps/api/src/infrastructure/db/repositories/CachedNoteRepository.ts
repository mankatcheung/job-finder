import type { Note } from '#src/domain/note/Note.js';
import type { INoteRepository } from '#src/use-cases/ports/INoteRepository.js';
import type { MemoryCache } from '#src/infrastructure/cache/MemoryCache.js';
import { CACHE_KEYS } from '#src/constants.js';

interface Deps {
  prismaNoteRepository: INoteRepository;
  cache: MemoryCache;
}

export class CachedNoteRepository implements INoteRepository {
  // Tracks which applicationId owns each note so delete() can invalidate the right list.
  private readonly appIdByNoteId = new Map<string, string>();
  private readonly inner: INoteRepository;
  private readonly cache: MemoryCache;

  constructor({ prismaNoteRepository, cache }: Deps) {
    this.inner = prismaNoteRepository;
    this.cache = cache;
  }

  async findAllByApplicationId(applicationId: string): Promise<Note[]> {
    const key = CACHE_KEYS.noteList(applicationId);
    const hit = this.cache.get<Note[]>(key);
    if (hit) return hit;

    const result = await this.inner.findAllByApplicationId(applicationId);
    this.cache.set(key, result);
    for (const note of result) this.appIdByNoteId.set(note.id, note.applicationId);
    return result;
  }

  async findById(id: string): Promise<Note | null> {
    const key = CACHE_KEYS.noteById(id);
    const hit = this.cache.get<Note | null>(key);
    if (hit !== undefined) return hit;

    const result = await this.inner.findById(id);
    this.cache.set(key, result);
    if (result) this.appIdByNoteId.set(id, result.applicationId);
    return result;
  }

  async create(data: { id: string; applicationId: string; content: string }): Promise<Note> {
    const result = await this.inner.create(data);
    this.appIdByNoteId.set(result.id, result.applicationId);
    this.cache.delete(CACHE_KEYS.noteList(result.applicationId));
    return result;
  }

  async update(id: string, content: string): Promise<Note> {
    const result = await this.inner.update(id, content);
    this.cache.delete(CACHE_KEYS.noteById(id));
    this.cache.delete(CACHE_KEYS.noteList(result.applicationId));
    this.appIdByNoteId.set(id, result.applicationId);
    return result;
  }

  async delete(id: string): Promise<void> {
    const applicationId = this.appIdByNoteId.get(id);
    await this.inner.delete(id);
    this.cache.delete(CACHE_KEYS.noteById(id));
    this.appIdByNoteId.delete(id);
    if (applicationId) this.cache.delete(CACHE_KEYS.noteList(applicationId));
  }
}
