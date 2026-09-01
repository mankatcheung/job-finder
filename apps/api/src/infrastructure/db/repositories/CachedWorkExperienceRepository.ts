import type { WorkExperience } from '#src/domain/workExperience/WorkExperience.js';
import type {
  IWorkExperienceRepository,
  CreateWorkExperienceData,
  UpdateWorkExperienceData,
} from '#src/use-cases/ports/IWorkExperienceRepository.js';
import type { ICache } from '#src/infrastructure/cache/ICache.js';
import { CACHE_KEYS } from '#src/infrastructure/config/constants.js';

interface Deps {
  drizzleWorkExperienceRepository: IWorkExperienceRepository;
  cache: ICache;
}

export class CachedWorkExperienceRepository implements IWorkExperienceRepository {
  private readonly inner: IWorkExperienceRepository;
  private readonly cache: ICache;

  constructor({ drizzleWorkExperienceRepository, cache }: Deps) {
    this.inner = drizzleWorkExperienceRepository;
    this.cache = cache;
  }

  async findAllByUserId(userId: string): Promise<WorkExperience[]> {
    const key = CACHE_KEYS.workExperienceList(userId);
    return this.cache.getOrSet(key, () => this.inner.findAllByUserId(userId));
  }

  async findById(id: string): Promise<WorkExperience | null> {
    const key = CACHE_KEYS.workExperienceById(id);
    return this.cache.getOrSet(key, () => this.inner.findById(id));
  }

  async create(data: CreateWorkExperienceData): Promise<WorkExperience> {
    const result = await this.inner.create(data);
    await this.cache.delete(CACHE_KEYS.workExperienceList(result.userId));
    return result;
  }

  async update(id: string, data: UpdateWorkExperienceData): Promise<WorkExperience> {
    const result = await this.inner.update(id, data);
    await this.cache.delete(CACHE_KEYS.workExperienceById(id));
    await this.cache.delete(CACHE_KEYS.workExperienceList(result.userId));
    return result;
  }

  async delete(id: string, userId: string): Promise<void> {
    await this.inner.delete(id, userId);
    await this.cache.delete(CACHE_KEYS.workExperienceById(id));
    await this.cache.delete(CACHE_KEYS.workExperienceList(userId));
  }
}
