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
    return this.cache.getOrSet(key, () => this.inner.findAllByUserId(userId, filters));
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
    return this.cache.getOrSet(key, () => this.inner.findById(id));
  }

  async create(data: CreateApplicationData): Promise<Application> {
    const result = await this.inner.create(data);
    await this.cache.deleteByPrefix(CACHE_KEYS.appListPrefix(result.userId));
    return result;
  }

  async update(id: string, data: UpdateApplicationData): Promise<Application> {
    const result = await this.inner.update(id, data);
    await this.cache.delete(CACHE_KEYS.appById(id));
    await this.cache.deleteByPrefix(CACHE_KEYS.appListPrefix(result.userId));
    return result;
  }

  async delete(id: string): Promise<void> {
    // Looked up via our own cached findById (Redis-backed in prod) rather
    // than a process-local map, so this stays correct even when the lookup
    // and the delete land on different serverless instances.
    const existing = await this.findById(id);
    await this.inner.delete(id);
    await this.cache.delete(CACHE_KEYS.appById(id));
    if (existing) {
      await this.cache.deleteByPrefix(CACHE_KEYS.appListPrefix(existing.userId));
      await this.cache.delete(CACHE_KEYS.appTrashList(existing.userId));
    }
  }

  async findDueForReminder(): Promise<Application[]> {
    return this.inner.findDueForReminder();
  }

  // Not cached: only the Trash operations and the detail query ask for this,
  // and both need to see the row exactly as it is right now.
  async findByIdIncludingTrashed(id: string): Promise<Application | null> {
    return this.inner.findByIdIncludingTrashed(id);
  }

  async findTrashedByUserId(userId: string): Promise<Application[]> {
    const key = CACHE_KEYS.appTrashList(userId);
    return this.cache.getOrSet(key, () => this.inner.findTrashedByUserId(userId));
  }

  // Not cached: the purge job runs once a day and must see the truth.
  async findDueForPurge(deletedBefore: Date): Promise<Application[]> {
    return this.inner.findDueForPurge(deletedBefore);
  }

  /**
   * Soft delete is an UPDATE, so it no longer passes through `delete()` and
   * its invalidation. Without busting the same keys here, a deleted
   * application keeps being served from the list cache — which is the whole
   * failure this decorator exists to prevent, arriving through a new door.
   */
  async softDelete(id: string, deletedAt: Date): Promise<void> {
    const existing = await this.inner.findByIdIncludingTrashed(id);
    await this.inner.softDelete(id, deletedAt);
    await this.invalidate(id, existing?.userId);
  }

  async restore(id: string): Promise<void> {
    const existing = await this.inner.findByIdIncludingTrashed(id);
    await this.inner.restore(id);
    await this.invalidate(id, existing?.userId);
  }

  private async invalidate(id: string, userId?: string): Promise<void> {
    await this.cache.delete(CACHE_KEYS.appById(id));
    if (userId) {
      await this.cache.deleteByPrefix(CACHE_KEYS.appListPrefix(userId));
      await this.cache.delete(CACHE_KEYS.appTrashList(userId));
    }
  }

  async updateReminderSentAt(id: string, sentAt: Date): Promise<void> {
    const existing = await this.findById(id);
    await this.inner.updateReminderSentAt(id, sentAt);
    await this.cache.delete(CACHE_KEYS.appById(id));
    if (existing) await this.cache.deleteByPrefix(CACHE_KEYS.appListPrefix(existing.userId));
  }
}
