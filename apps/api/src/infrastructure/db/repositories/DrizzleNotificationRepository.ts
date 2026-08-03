import { eq, and, or, desc, lt, inArray, isNull, isNotNull, sql } from 'drizzle-orm';
import type { DrizzleDb, DrizzleClient } from '../client.js';
import { notification } from '../schema.js';
import type { Notification, NotificationType } from '#src/domain/notification/Notification.js';
import { getClient } from '../transactionContext.js';
import type {
  INotificationRepository,
  CreateNotificationData,
  FindNotificationsPagePagination,
  NotificationsPage,
} from '#src/use-cases/ports/INotificationRepository.js';

export class DrizzleNotificationRepository implements INotificationRepository {
  private readonly database: DrizzleDb;

  constructor({ db }: { db: DrizzleDb }) {
    this.database = db;
  }

  private get db(): DrizzleClient {
    return getClient(this.database);
  }

  async create(data: CreateNotificationData): Promise<Notification> {
    const [row] = await this.db
      .insert(notification)
      .values({
        id: data.id,
        userId: data.userId,
        type: data.type,
        title: data.title,
        body: data.body,
        url: data.url ?? null,
      })
      .returning();
    return this.toEntity(row);
  }

  async findPageByUserId(
    userId: string,
    pagination: FindNotificationsPagePagination,
  ): Promise<NotificationsPage> {
    const { limit, cursor } = pagination;
    const conditions = [eq(notification.userId, userId)];

    if (cursor) {
      const [cursorRow] = await this.db
        .select({ createdAt: notification.createdAt, id: notification.id })
        .from(notification)
        .where(eq(notification.id, cursor))
        .limit(1);
      if (cursorRow) {
        conditions.push(
          or(
            lt(notification.createdAt, cursorRow.createdAt),
            and(eq(notification.createdAt, cursorRow.createdAt), lt(notification.id, cursorRow.id)),
          )!,
        );
      }
    }

    const rows = await this.db
      .select()
      .from(notification)
      .where(and(...conditions))
      .orderBy(desc(notification.createdAt), desc(notification.id))
      .limit(limit + 1);

    const hasNextPage = rows.length > limit;
    const items = hasNextPage ? rows.slice(0, limit) : rows;
    return { items: items.map((r) => this.toEntity(r)), hasNextPage };
  }

  async markManyReadForUser(userId: string, ids: string[], isRead: boolean): Promise<number> {
    const result = await this.db
      .update(notification)
      .set({ readAt: isRead ? new Date() : null })
      .where(
        and(
          eq(notification.userId, userId),
          inArray(notification.id, ids),
          isRead ? isNull(notification.readAt) : isNotNull(notification.readAt),
        ),
      )
      .returning({ id: notification.id });
    return result.length;
  }

  async countUnreadForUser(userId: string): Promise<number> {
    const [row] = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(notification)
      .where(and(eq(notification.userId, userId), isNull(notification.readAt)));
    return row?.count ?? 0;
  }

  private toEntity(row: typeof notification.$inferSelect): Notification {
    return {
      id: row.id,
      userId: row.userId,
      type: row.type as NotificationType,
      title: row.title,
      body: row.body,
      url: row.url,
      readAt: row.readAt,
      createdAt: row.createdAt,
    };
  }
}
