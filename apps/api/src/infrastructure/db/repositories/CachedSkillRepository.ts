import type { Skill } from '#src/domain/skill/Skill.js';
import type {
  ISkillRepository,
  CreateSkillData,
  UpdateSkillData,
} from '#src/use-cases/ports/ISkillRepository.js';
import type { ICache } from '#src/infrastructure/cache/ICache.js';
import { CACHE_KEYS } from '#src/constants.js';

interface Deps {
  drizzleSkillRepository: ISkillRepository;
  cache: ICache;
}

export class CachedSkillRepository implements ISkillRepository {
  private readonly inner: ISkillRepository;
  private readonly cache: ICache;

  constructor({ drizzleSkillRepository, cache }: Deps) {
    this.inner = drizzleSkillRepository;
    this.cache = cache;
  }

  async findAllByUserId(userId: string): Promise<Skill[]> {
    const key = CACHE_KEYS.skillList(userId);
    return this.cache.getOrSet(key, () => this.inner.findAllByUserId(userId));
  }

  async findById(id: string): Promise<Skill | null> {
    const key = CACHE_KEYS.skillById(id);
    return this.cache.getOrSet(key, () => this.inner.findById(id));
  }

  async create(data: CreateSkillData): Promise<Skill> {
    const result = await this.inner.create(data);
    await this.cache.delete(CACHE_KEYS.skillList(result.userId));
    return result;
  }

  async update(id: string, data: UpdateSkillData): Promise<Skill> {
    const result = await this.inner.update(id, data);
    await this.cache.delete(CACHE_KEYS.skillById(id));
    await this.cache.delete(CACHE_KEYS.skillList(result.userId));
    return result;
  }

  async delete(id: string, userId: string): Promise<void> {
    await this.inner.delete(id, userId);
    await this.cache.delete(CACHE_KEYS.skillById(id));
    await this.cache.delete(CACHE_KEYS.skillList(userId));
  }
}
