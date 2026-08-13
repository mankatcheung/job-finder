import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core';
import { user } from './user.js';

export const pushSubscription = sqliteTable(
  'PushSubscription',
  {
    id: text('id').primaryKey(),
    userId: text('userId')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    endpoint: text('endpoint').notNull().unique(),
    p256dh: text('p256dh').notNull(),
    auth: text('auth').notNull(),
    createdAt: integer('createdAt', { mode: 'timestamp_ms' })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: integer('updatedAt', { mode: 'timestamp_ms' })
      .notNull()
      .$defaultFn(() => new Date())
      .$onUpdate(() => new Date()),
  },
  (table) => [index('PushSubscription_userId_idx').on(table.userId)],
);

export const notification = sqliteTable(
  'Notification',
  {
    id: text('id').primaryKey(),
    userId: text('userId')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    /** See NOTIFICATION_TYPE in constants.ts — drives which icon the inbox shows. */
    type: text('type', {
      enum: ['interview_reminder', 'follow_up_reminder', 'security_alert'],
    }).notNull(),
    title: text('title').notNull(),
    body: text('body').notNull(),
    /** Where clicking the notification navigates to; null if not actionable. */
    url: text('url'),
    /** Null = unread. Set to the time the user marked it read. */
    readAt: integer('readAt', { mode: 'timestamp_ms' }),
    createdAt: integer('createdAt', { mode: 'timestamp_ms' })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => [
    index('Notification_userId_idx').on(table.userId),
    index('Notification_userId_readAt_idx').on(table.userId, table.readAt),
  ],
);
