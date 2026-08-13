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
import type { ICache } from '#src/infrastructure/cache/ICache.js';
import { CACHE_KEYS } from '#src/constants.js';

interface Deps {
  drizzleApplicationRepository: IApplicationRepository;
  cache: ICache;
}

export class CachedApplicationRepository implements IApplicationRepository {
  // Tracks which userId owns each applicationId so delete() can invalidate the right list.
  private readonly userIdByAppId = new Map<string, string>();
  private readonly inner: IApplicationRepository;
  private readonly cache: ICache;

  constructor({ drizzleApplicationRepository, cache }: Deps) {
    this.inner = drizzleApplicationRepository;
    this.cache = cache;
  }

  async findAllByUserId(
    userId: string,
    filters?: { status?: ApplicationStatus },
  ): Promise<Application[]> {
    const key = CACHE_KEYS.appList(userId, filters?.status ?? '');
    const result = await this.cache.getOrSet(key, () =>
      this.inner.findAllByUserId(userId, filters),
    );
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
    const result = await this.cache.getOrSet(key, () => this.inner.findById(id));
    if (result) this.userIdByAppId.set(id, result.userId);
    return result;
  }

  async create(data: CreateApplicationData): Promise<Application> {
    const result = await this.inner.create(data);
    this.userIdByAppId.set(result.id, result.userId);
    await this.cache.deleteByPrefix(CACHE_KEYS.appListPrefix(result.userId));
    return result;
  }

  async update(id: string, data: UpdateApplicationData): Promise<Application> {
    const result = await this.inner.update(id, data);
    await this.cache.delete(CACHE_KEYS.appById(id));
    await this.cache.deleteByPrefix(CACHE_KEYS.appListPrefix(result.userId));
    this.userIdByAppId.set(id, result.userId);
    return result;
  }

  async delete(id: string): Promise<void> {
    const userId = this.userIdByAppId.get(id);
    await this.inner.delete(id);
    await this.cache.delete(CACHE_KEYS.appById(id));
    this.userIdByAppId.delete(id);
    if (userId) await this.cache.deleteByPrefix(CACHE_KEYS.appListPrefix(userId));
  }

  async findDueForReminder(): Promise<Application[]> {
    return this.inner.findDueForReminder();
  }

  async updateReminderSentAt(id: string, sentAt: Date): Promise<void> {
    await this.inner.updateReminderSentAt(id, sentAt);
    await this.cache.delete(CACHE_KEYS.appById(id));
  }
}
