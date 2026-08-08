import type { WorkExperience } from '#src/domain/workExperience/WorkExperience.js';
import type {
  IWorkExperienceRepository,
  CreateWorkExperienceData,
  UpdateWorkExperienceData,
} from '#src/use-cases/ports/IWorkExperienceRepository.js';
import type { MemoryCache } from '#src/infrastructure/cache/MemoryCache.js';
import { CACHE_KEYS } from '#src/constants.js';

interface Deps {
  drizzleWorkExperienceRepository: IWorkExperienceRepository;
  cache: MemoryCache;
}

export class CachedWorkExperienceRepository implements IWorkExperienceRepository {
  // Tracks which userId owns each work experience entry so delete() can invalidate the right list.
  private readonly userIdByWorkExperienceId = new Map<string, string>();
  private readonly inner: IWorkExperienceRepository;
  private readonly cache: MemoryCache;

  constructor({ drizzleWorkExperienceRepository, cache }: Deps) {
    this.inner = drizzleWorkExperienceRepository;
    this.cache = cache;
  }

  async findAllByUserId(userId: string): Promise<WorkExperience[]> {
    const key = CACHE_KEYS.workExperienceList(userId);
    const hit = this.cache.get<WorkExperience[]>(key);
    if (hit) return hit;

    const result = await this.inner.findAllByUserId(userId);
    this.cache.set(key, result);
    for (const experience of result) {
      this.userIdByWorkExperienceId.set(experience.id, experience.userId);
    }
    return result;
  }

  async findById(id: string): Promise<WorkExperience | null> {
    const key = CACHE_KEYS.workExperienceById(id);
    const hit = this.cache.get<WorkExperience | null>(key);
    if (hit !== undefined) return hit;

    const result = await this.inner.findById(id);
    this.cache.set(key, result);
    if (result) this.userIdByWorkExperienceId.set(id, result.userId);
    return result;
  }

  async create(data: CreateWorkExperienceData): Promise<WorkExperience> {
    const result = await this.inner.create(data);
    this.userIdByWorkExperienceId.set(result.id, result.userId);
    this.cache.delete(CACHE_KEYS.workExperienceList(result.userId));
    return result;
  }

  async update(id: string, data: UpdateWorkExperienceData): Promise<WorkExperience> {
    const result = await this.inner.update(id, data);
    this.cache.delete(CACHE_KEYS.workExperienceById(id));
    this.cache.delete(CACHE_KEYS.workExperienceList(result.userId));
    this.userIdByWorkExperienceId.set(id, result.userId);
    return result;
  }

  async delete(id: string): Promise<void> {
    const userId = this.userIdByWorkExperienceId.get(id);
    await this.inner.delete(id);
    this.cache.delete(CACHE_KEYS.workExperienceById(id));
    this.userIdByWorkExperienceId.delete(id);
    if (userId) this.cache.delete(CACHE_KEYS.workExperienceList(userId));
  }
}
