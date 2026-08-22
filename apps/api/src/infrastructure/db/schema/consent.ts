import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

/**
 * Anonymous cookie-consent decisions (JEF-211) — no `userId` FK, since these
 * are recorded before/without an account existing. Not covered by
 * `onDeleteBehaviour.test.ts`'s foreign-key sweep for that reason.
 */
export const cookieConsent = sqliteTable('CookieConsent', {
  id: text('id').primaryKey(),
  analyticsAccepted: integer('analyticsAccepted', { mode: 'boolean' }).notNull(),
  ipAddress: text('ipAddress'),
  userAgent: text('userAgent'),
  consentedAt: integer('consentedAt', { mode: 'timestamp_ms' })
    .notNull()
    .$defaultFn(() => new Date()),
});
