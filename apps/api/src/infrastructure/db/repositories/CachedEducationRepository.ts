import type { Education } from '#src/domain/education/Education.js';
import type {
  IEducationRepository,
  CreateEducationData,
  UpdateEducationData,
} from '#src/use-cases/ports/IEducationRepository.js';
import type { ICache } from '#src/infrastructure/cache/ICache.js';
import { CACHE_KEYS } from '#src/constants.js';

interface Deps {
  drizzleEducationRepository: IEducationRepository;
  cache: ICache;
}

export class CachedEducationRepository implements IEducationRepository {
  // Tracks which userId owns each education entry so delete() can invalidate the right list.
  private readonly userIdByEducationId = new Map<string, string>();
  private readonly inner: IEducationRepository;
  private readonly cache: ICache;

  constructor({ drizzleEducationRepository, cache }: Deps) {
    this.inner = drizzleEducationRepository;
    this.cache = cache;
  }

  async findAllByUserId(userId: string): Promise<Education[]> {
    const key = CACHE_KEYS.educationList(userId);
    const result = await this.cache.getOrSet(key, () => this.inner.findAllByUserId(userId));
    for (const education of result) this.userIdByEducationId.set(education.id, education.userId);
    return result;
  }

  async findById(id: string): Promise<Education | null> {
    const key = CACHE_KEYS.educationById(id);
    const result = await this.cache.getOrSet(key, () => this.inner.findById(id));
    if (result) this.userIdByEducationId.set(id, result.userId);
    return result;
  }

  async create(data: CreateEducationData): Promise<Education> {
    const result = await this.inner.create(data);
    this.userIdByEducationId.set(result.id, result.userId);
    await this.cache.delete(CACHE_KEYS.educationList(result.userId));
    return result;
  }

  async update(id: string, data: UpdateEducationData): Promise<Education> {
    const result = await this.inner.update(id, data);
    await this.cache.delete(CACHE_KEYS.educationById(id));
    await this.cache.delete(CACHE_KEYS.educationList(result.userId));
    this.userIdByEducationId.set(id, result.userId);
    return result;
  }

  async delete(id: string): Promise<void> {
    const userId = this.userIdByEducationId.get(id);
    await this.inner.delete(id);
    await this.cache.delete(CACHE_KEYS.educationById(id));
    this.userIdByEducationId.delete(id);
    if (userId) await this.cache.delete(CACHE_KEYS.educationList(userId));
  }
}
