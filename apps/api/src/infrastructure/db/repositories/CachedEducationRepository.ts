import type { Education } from '#src/domain/education/Education.js';
import type {
  IEducationRepository,
  CreateEducationData,
  UpdateEducationData,
} from '#src/use-cases/ports/IEducationRepository.js';
import type { ICache } from '#src/infrastructure/cache/ICache.js';
import { CACHE_KEYS } from '#src/infrastructure/config/constants.js';

interface Deps {
  drizzleEducationRepository: IEducationRepository;
  cache: ICache;
}

export class CachedEducationRepository implements IEducationRepository {
  private readonly inner: IEducationRepository;
  private readonly cache: ICache;

  constructor({ drizzleEducationRepository, cache }: Deps) {
    this.inner = drizzleEducationRepository;
    this.cache = cache;
  }

  async findAllByUserId(userId: string): Promise<Education[]> {
    const key = CACHE_KEYS.educationList(userId);
    return this.cache.getOrSet(key, () => this.inner.findAllByUserId(userId));
  }

  async findById(id: string): Promise<Education | null> {
    const key = CACHE_KEYS.educationById(id);
    return this.cache.getOrSet(key, () => this.inner.findById(id));
  }

  async create(data: CreateEducationData): Promise<Education> {
    const result = await this.inner.create(data);
    await this.cache.delete(CACHE_KEYS.educationList(result.userId));
    return result;
  }

  async update(id: string, data: UpdateEducationData): Promise<Education> {
    const result = await this.inner.update(id, data);
    await this.cache.delete(CACHE_KEYS.educationById(id));
    await this.cache.delete(CACHE_KEYS.educationList(result.userId));
    return result;
  }

  async delete(id: string, userId: string): Promise<void> {
    await this.inner.delete(id, userId);
    await this.cache.delete(CACHE_KEYS.educationById(id));
    await this.cache.delete(CACHE_KEYS.educationList(userId));
  }
}
