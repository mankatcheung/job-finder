import type { Document } from '#src/domain/document/Document.js';
import type {
  IDocumentRepository,
  CreateDocumentData,
} from '#src/use-cases/ports/IDocumentRepository.js';
import type { MemoryCache } from '#src/infrastructure/cache/MemoryCache.js';
import { CACHE_KEYS } from '#src/constants.js';

interface Deps {
  prismaDocumentRepository: IDocumentRepository;
  cache: MemoryCache;
}

export class CachedDocumentRepository implements IDocumentRepository {
  // Tracks which applicationId owns each document so delete() can invalidate the right list.
  private readonly appIdByDocId = new Map<string, string>();
  private readonly inner: IDocumentRepository;
  private readonly cache: MemoryCache;

  constructor({ prismaDocumentRepository, cache }: Deps) {
    this.inner = prismaDocumentRepository;
    this.cache = cache;
  }

  async findAllByApplicationId(applicationId: string): Promise<Document[]> {
    const key = CACHE_KEYS.docList(applicationId);
    const hit = this.cache.get<Document[]>(key);
    if (hit) return hit;

    const result = await this.inner.findAllByApplicationId(applicationId);
    this.cache.set(key, result);
    for (const doc of result) this.appIdByDocId.set(doc.id, doc.applicationId);
    return result;
  }

  async findById(id: string): Promise<Document | null> {
    const key = CACHE_KEYS.docById(id);
    const hit = this.cache.get<Document | null>(key);
    if (hit !== undefined) return hit;

    const result = await this.inner.findById(id);
    this.cache.set(key, result);
    if (result) this.appIdByDocId.set(id, result.applicationId);
    return result;
  }

  async create(data: CreateDocumentData): Promise<Document> {
    const result = await this.inner.create(data);
    this.appIdByDocId.set(result.id, result.applicationId);
    this.cache.delete(CACHE_KEYS.docList(result.applicationId));
    return result;
  }

  async delete(id: string): Promise<void> {
    const applicationId = this.appIdByDocId.get(id);
    await this.inner.delete(id);
    this.cache.delete(CACHE_KEYS.docById(id));
    this.appIdByDocId.delete(id);
    if (applicationId) this.cache.delete(CACHE_KEYS.docList(applicationId));
  }
}
