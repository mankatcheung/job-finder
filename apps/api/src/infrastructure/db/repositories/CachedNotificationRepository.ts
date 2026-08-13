import type { Notification } from '#src/domain/notification/Notification.js';
import type {
  INotificationRepository,
  CreateNotificationData,
  FindNotificationsPagePagination,
  NotificationsPage,
} from '#src/use-cases/ports/INotificationRepository.js';
import type { ICache } from '#src/infrastructure/cache/ICache.js';
import { CACHE_KEYS } from '#src/constants.js';

interface Deps {
  drizzleNotificationRepository: INotificationRepository;
  cache: ICache;
}

/**
 * Only `countUnreadForUser` is cached — it backs the notification-bell badge
 * and is re-fetched frequently. `findPageByUserId` is cursor-paginated (too
 * varied to key, same reasoning `CachedApplicationRepository` already applies
 * to its own cursor/filter-heavy list method) so it passes straight through.
 */
export class CachedNotificationRepository implements INotificationRepository {
  private readonly inner: INotificationRepository;
  private readonly cache: ICache;

  constructor({ drizzleNotificationRepository, cache }: Deps) {
    this.inner = drizzleNotificationRepository;
    this.cache = cache;
  }

  async create(data: CreateNotificationData): Promise<Notification> {
    const result = await this.inner.create(data);
    await this.cache.delete(CACHE_KEYS.notificationUnreadCount(data.userId));
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
    await this.cache.delete(CACHE_KEYS.notificationUnreadCount(userId));
    return result;
  }

  async countUnreadForUser(userId: string): Promise<number> {
    const key = CACHE_KEYS.notificationUnreadCount(userId);
    return this.cache.getOrSet(key, () => this.inner.countUnreadForUser(userId));
  }
}
