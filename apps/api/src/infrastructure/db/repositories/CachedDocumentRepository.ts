import type { Document } from '#src/domain/document/Document.js';
import type {
  IDocumentRepository,
  CreateDocumentData,
} from '#src/use-cases/ports/IDocumentRepository.js';
import type { ICache } from '#src/infrastructure/cache/ICache.js';
import { BoundedMap } from '#src/infrastructure/cache/BoundedMap.js';
import { CACHE, CACHE_KEYS } from '#src/constants.js';

interface Deps {
  drizzleDocumentRepository: IDocumentRepository;
  cache: ICache;
}

export class CachedDocumentRepository implements IDocumentRepository {
  // Tracks which applicationId owns each document so delete() can invalidate the right list.
  private readonly appIdByDocId = new BoundedMap<string, string>(CACHE.REVERSE_INDEX_MAX_ENTRIES);
  private readonly inner: IDocumentRepository;
  private readonly cache: ICache;

  constructor({ drizzleDocumentRepository, cache }: Deps) {
    this.inner = drizzleDocumentRepository;
    this.cache = cache;
  }

  async findAllByApplicationId(applicationId: string): Promise<Document[]> {
    const key = CACHE_KEYS.docList(applicationId);
    const result = await this.cache.getOrSet(key, () =>
      this.inner.findAllByApplicationId(applicationId),
    );
    for (const doc of result) this.appIdByDocId.set(doc.id, doc.applicationId);
    return result;
  }

  // Not cached: this reads across every application for the user, which
  // doesn't fit the per-applicationId cache key scheme used above, and
  // invalidating it correctly would require busting it on every document
  // create/delete for any of the user's applications.
  async findAllByUserId(userId: string): Promise<Document[]> {
    return this.inner.findAllByUserId(userId);
  }

  async findById(id: string): Promise<Document | null> {
    const key = CACHE_KEYS.docById(id);
    const result = await this.cache.getOrSet(key, () => this.inner.findById(id));
    if (result) this.appIdByDocId.set(id, result.applicationId);
    return result;
  }

  async create(data: CreateDocumentData): Promise<Document> {
    const result = await this.inner.create(data);
    this.appIdByDocId.set(result.id, result.applicationId);
    await this.cache.delete(CACHE_KEYS.docList(result.applicationId));
    return result;
  }

  async delete(id: string): Promise<void> {
    const applicationId = this.appIdByDocId.get(id);
    await this.inner.delete(id);
    await this.cache.delete(CACHE_KEYS.docById(id));
    this.appIdByDocId.delete(id);
    if (applicationId) await this.cache.delete(CACHE_KEYS.docList(applicationId));
  }
}
