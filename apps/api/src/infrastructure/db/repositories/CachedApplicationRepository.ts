import type { Application } from '#src/domain/application/Application.js';
import type { ApplicationStatus } from '#src/domain/application/ApplicationStatus.js';
import type {
  IApplicationRepository,
  CreateApplicationData,
  UpdateApplicationData,
  FindApplicationsPageFilters,
  FindApplicationsPagePagination,
  ApplicationsPage,
} from '#src/use-cases/ports/IApplicationRepository.js';
import type { MemoryCache } from '#src/infrastructure/cache/MemoryCache.js';
import { CACHE_KEYS } from '#src/constants.js';

interface Deps {
  prismaApplicationRepository: IApplicationRepository;
  cache: MemoryCache;
}

export class CachedApplicationRepository implements IApplicationRepository {
  // Tracks which userId owns each applicationId so delete() can invalidate the right list.
  private readonly userIdByAppId = new Map<string, string>();
  private readonly inner: IApplicationRepository;
  private readonly cache: MemoryCache;

  constructor({ prismaApplicationRepository, cache }: Deps) {
    this.inner = prismaApplicationRepository;
    this.cache = cache;
  }

  async findAllByUserId(
    userId: string,
    filters?: { status?: ApplicationStatus },
  ): Promise<Application[]> {
    const key = CACHE_KEYS.appList(userId, filters?.status ?? '');
    const hit = this.cache.get<Application[]>(key);
    if (hit) return hit;

    const result = await this.inner.findAllByUserId(userId, filters);
    this.cache.set(key, result);
    for (const app of result) this.userIdByAppId.set(app.id, app.userId);
    return result;
  }

  // Not cached: cursor/search/filter combinations are too varied to key
  // usefully, and infinite-scroll pages are rarely re-requested identically.
  async findPageByUserId(
    userId: string,
    filters: FindApplicationsPageFilters,
    pagination: FindApplicationsPagePagination,
  ): Promise<ApplicationsPage> {
    return this.inner.findPageByUserId(userId, filters, pagination);
  }

  async findById(id: string): Promise<Application | null> {
    const key = CACHE_KEYS.appById(id);
    const hit = this.cache.get<Application | null>(key);
    if (hit !== undefined) return hit;

    const result = await this.inner.findById(id);
    this.cache.set(key, result);
    if (result) this.userIdByAppId.set(id, result.userId);
    return result;
  }

  async create(data: CreateApplicationData): Promise<Application> {
    const result = await this.inner.create(data);
    this.userIdByAppId.set(result.id, result.userId);
    this.cache.deleteByPrefix(CACHE_KEYS.appListPrefix(result.userId));
    return result;
  }

  async update(id: string, data: UpdateApplicationData): Promise<Application> {
    const result = await this.inner.update(id, data);
    this.cache.delete(CACHE_KEYS.appById(id));
    this.cache.deleteByPrefix(CACHE_KEYS.appListPrefix(result.userId));
    this.userIdByAppId.set(id, result.userId);
    return result;
  }

  async delete(id: string): Promise<void> {
    const userId = this.userIdByAppId.get(id);
    await this.inner.delete(id);
    this.cache.delete(CACHE_KEYS.appById(id));
    this.userIdByAppId.delete(id);
    if (userId) this.cache.deleteByPrefix(CACHE_KEYS.appListPrefix(userId));
  }

  async findDueForReminder(): Promise<Application[]> {
    return this.inner.findDueForReminder();
  }

  async updateReminderSentAt(id: string, sentAt: Date): Promise<void> {
    await this.inner.updateReminderSentAt(id, sentAt);
    this.cache.delete(CACHE_KEYS.appById(id));
  }
}
