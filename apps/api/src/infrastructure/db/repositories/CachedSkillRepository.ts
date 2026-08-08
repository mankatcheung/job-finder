import type { Skill } from '#src/domain/skill/Skill.js';
import type {
  ISkillRepository,
  CreateSkillData,
  UpdateSkillData,
} from '#src/use-cases/ports/ISkillRepository.js';
import type { MemoryCache } from '#src/infrastructure/cache/MemoryCache.js';
import { CACHE_KEYS } from '#src/constants.js';

interface Deps {
  drizzleSkillRepository: ISkillRepository;
  cache: MemoryCache;
}

export class CachedSkillRepository implements ISkillRepository {
  // Tracks which userId owns each skill so delete() can invalidate the right list.
  private readonly userIdBySkillId = new Map<string, string>();
  private readonly inner: ISkillRepository;
  private readonly cache: MemoryCache;

  constructor({ drizzleSkillRepository, cache }: Deps) {
    this.inner = drizzleSkillRepository;
    this.cache = cache;
  }

  async findAllByUserId(userId: string): Promise<Skill[]> {
    const key = CACHE_KEYS.skillList(userId);
    const hit = this.cache.get<Skill[]>(key);
    if (hit) return hit;

    const result = await this.inner.findAllByUserId(userId);
    this.cache.set(key, result);
    for (const skill of result) this.userIdBySkillId.set(skill.id, skill.userId);
    return result;
  }

  async findById(id: string): Promise<Skill | null> {
    const key = CACHE_KEYS.skillById(id);
    const hit = this.cache.get<Skill | null>(key);
    if (hit !== undefined) return hit;

    const result = await this.inner.findById(id);
    this.cache.set(key, result);
    if (result) this.userIdBySkillId.set(id, result.userId);
    return result;
  }

  async create(data: CreateSkillData): Promise<Skill> {
    const result = await this.inner.create(data);
    this.userIdBySkillId.set(result.id, result.userId);
    this.cache.delete(CACHE_KEYS.skillList(result.userId));
    return result;
  }

  async update(id: string, data: UpdateSkillData): Promise<Skill> {
    const result = await this.inner.update(id, data);
    this.cache.delete(CACHE_KEYS.skillById(id));
    this.cache.delete(CACHE_KEYS.skillList(result.userId));
    this.userIdBySkillId.set(id, result.userId);
    return result;
  }

  async delete(id: string): Promise<void> {
    const userId = this.userIdBySkillId.get(id);
    await this.inner.delete(id);
    this.cache.delete(CACHE_KEYS.skillById(id));
    this.userIdBySkillId.delete(id);
    if (userId) this.cache.delete(CACHE_KEYS.skillList(userId));
  }
}
