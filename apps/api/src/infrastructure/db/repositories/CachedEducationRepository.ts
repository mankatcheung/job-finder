import type { Education } from '#src/domain/education/Education.js';
import type {
  IEducationRepository,
  CreateEducationData,
  UpdateEducationData,
} from '#src/use-cases/ports/IEducationRepository.js';
import type { MemoryCache } from '#src/infrastructure/cache/MemoryCache.js';
import { CACHE_KEYS } from '#src/constants.js';

interface Deps {
  drizzleEducationRepository: IEducationRepository;
  cache: MemoryCache;
}

export class CachedEducationRepository implements IEducationRepository {
  // Tracks which userId owns each education entry so delete() can invalidate the right list.
  private readonly userIdByEducationId = new Map<string, string>();
  private readonly inner: IEducationRepository;
  private readonly cache: MemoryCache;

  constructor({ drizzleEducationRepository, cache }: Deps) {
    this.inner = drizzleEducationRepository;
    this.cache = cache;
  }

  async findAllByUserId(userId: string): Promise<Education[]> {
    const key = CACHE_KEYS.educationList(userId);
    const hit = this.cache.get<Education[]>(key);
    if (hit) return hit;

    const result = await this.inner.findAllByUserId(userId);
    this.cache.set(key, result);
    for (const education of result) this.userIdByEducationId.set(education.id, education.userId);
    return result;
  }

  async findById(id: string): Promise<Education | null> {
    const key = CACHE_KEYS.educationById(id);
    const hit = this.cache.get<Education | null>(key);
    if (hit !== undefined) return hit;

    const result = await this.inner.findById(id);
    this.cache.set(key, result);
    if (result) this.userIdByEducationId.set(id, result.userId);
    return result;
  }

  async create(data: CreateEducationData): Promise<Education> {
    const result = await this.inner.create(data);
    this.userIdByEducationId.set(result.id, result.userId);
    this.cache.delete(CACHE_KEYS.educationList(result.userId));
    return result;
  }

  async update(id: string, data: UpdateEducationData): Promise<Education> {
    const result = await this.inner.update(id, data);
    this.cache.delete(CACHE_KEYS.educationById(id));
    this.cache.delete(CACHE_KEYS.educationList(result.userId));
    this.userIdByEducationId.set(id, result.userId);
    return result;
  }

  async delete(id: string): Promise<void> {
    const userId = this.userIdByEducationId.get(id);
    await this.inner.delete(id);
    this.cache.delete(CACHE_KEYS.educationById(id));
    this.userIdByEducationId.delete(id);
    if (userId) this.cache.delete(CACHE_KEYS.educationList(userId));
  }
}
