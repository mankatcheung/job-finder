import type { WorkExperience } from '#src/domain/workExperience/WorkExperience.js';
import type {
  IWorkExperienceRepository,
  CreateWorkExperienceData,
  UpdateWorkExperienceData,
} from '#src/use-cases/ports/IWorkExperienceRepository.js';
import type { ICache } from '#src/infrastructure/cache/ICache.js';
import { BoundedMap } from '#src/infrastructure/cache/BoundedMap.js';
import { CACHE, CACHE_KEYS } from '#src/constants.js';

interface Deps {
  drizzleWorkExperienceRepository: IWorkExperienceRepository;
  cache: ICache;
}

export class CachedWorkExperienceRepository implements IWorkExperienceRepository {
  // Tracks which userId owns each work experience entry so delete() can invalidate the right list.
  private readonly userIdByWorkExperienceId = new BoundedMap<string, string>(
    CACHE.REVERSE_INDEX_MAX_ENTRIES,
  );
  private readonly inner: IWorkExperienceRepository;
  private readonly cache: ICache;

  constructor({ drizzleWorkExperienceRepository, cache }: Deps) {
    this.inner = drizzleWorkExperienceRepository;
    this.cache = cache;
  }

  async findAllByUserId(userId: string): Promise<WorkExperience[]> {
    const key = CACHE_KEYS.workExperienceList(userId);
    const result = await this.cache.getOrSet(key, () => this.inner.findAllByUserId(userId));
    for (const experience of result) {
      this.userIdByWorkExperienceId.set(experience.id, experience.userId);
    }
    return result;
  }

  async findById(id: string): Promise<WorkExperience | null> {
    const key = CACHE_KEYS.workExperienceById(id);
    const result = await this.cache.getOrSet(key, () => this.inner.findById(id));
    if (result) this.userIdByWorkExperienceId.set(id, result.userId);
    return result;
  }

  async create(data: CreateWorkExperienceData): Promise<WorkExperience> {
    const result = await this.inner.create(data);
    this.userIdByWorkExperienceId.set(result.id, result.userId);
    await this.cache.delete(CACHE_KEYS.workExperienceList(result.userId));
    return result;
  }

  async update(id: string, data: UpdateWorkExperienceData): Promise<WorkExperience> {
    const result = await this.inner.update(id, data);
    await this.cache.delete(CACHE_KEYS.workExperienceById(id));
    await this.cache.delete(CACHE_KEYS.workExperienceList(result.userId));
    this.userIdByWorkExperienceId.set(id, result.userId);
    return result;
  }

  async delete(id: string): Promise<void> {
    const userId = this.userIdByWorkExperienceId.get(id);
    await this.inner.delete(id);
    await this.cache.delete(CACHE_KEYS.workExperienceById(id));
    this.userIdByWorkExperienceId.delete(id);
    if (userId) await this.cache.delete(CACHE_KEYS.workExperienceList(userId));
  }
}
