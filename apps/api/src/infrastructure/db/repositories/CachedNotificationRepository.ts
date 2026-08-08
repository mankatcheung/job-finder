import type { Notification } from '#src/domain/notification/Notification.js';
import type {
  INotificationRepository,
  CreateNotificationData,
  FindNotificationsPagePagination,
  NotificationsPage,
} from '#src/use-cases/ports/INotificationRepository.js';
import type { MemoryCache } from '#src/infrastructure/cache/MemoryCache.js';
import { CACHE_KEYS } from '#src/constants.js';

interface Deps {
  drizzleNotificationRepository: INotificationRepository;
  cache: MemoryCache;
}

/**
 * Only `countUnreadForUser` is cached — it backs the notification-bell badge
 * and is re-fetched frequently. `findPageByUserId` is cursor-paginated (too
 * varied to key, same reasoning `CachedApplicationRepository` already applies
 * to its own cursor/filter-heavy list method) so it passes straight through.
 */
export class CachedNotificationRepository implements INotificationRepository {
  private readonly inner: INotificationRepository;
  private readonly cache: MemoryCache;

  constructor({ drizzleNotificationRepository, cache }: Deps) {
    this.inner = drizzleNotificationRepository;
    this.cache = cache;
  }

  async create(data: CreateNotificationData): Promise<Notification> {
    const result = await this.inner.create(data);
    this.cache.delete(CACHE_KEYS.notificationUnreadCount(data.userId));
    return result;
  }

  findPageByUserId(
    userId: string,
    pagination: FindNotificationsPagePagination,
  ): Promise<NotificationsPage> {
    return this.inner.findPageByUserId(userId, pagination);
  }

  async markManyReadForUser(userId: string, ids: string[], isRead: boolean): Promise<number> {
    const result = await this.inner.markManyReadForUser(userId, ids, isRead);
    this.cache.delete(CACHE_KEYS.notificationUnreadCount(userId));
    return result;
  }

  async countUnreadForUser(userId: string): Promise<number> {
    const key = CACHE_KEYS.notificationUnreadCount(userId);
    const hit = this.cache.get<number>(key);
    if (hit !== undefined) return hit;

    const result = await this.inner.countUnreadForUser(userId);
    this.cache.set(key, result);
    return result;
  }
}
