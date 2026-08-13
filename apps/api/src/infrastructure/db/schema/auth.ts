import { sqliteTable, text, integer, index, uniqueIndex } from 'drizzle-orm/sqlite-core';
import { user } from './user.js';

export const oauthAccount = sqliteTable(
  'OAuthAccount',
  {
    id: text('id').primaryKey(),
    userId: text('userId')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    provider: text('provider').notNull(),
    providerAccountId: text('providerAccountId').notNull(),
    email: text('email'),
    createdAt: integer('createdAt', { mode: 'timestamp_ms' })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => [
    uniqueIndex('OAuthAccount_provider_providerAccountId_key').on(
      table.provider,
      table.providerAccountId,
    ),
    index('OAuthAccount_userId_idx').on(table.userId),
  ],
);

export const totpBackupCode = sqliteTable(
  'TotpBackupCode',
  {
    id: text('id').primaryKey(),
    userId: text('userId')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    codeHash: text('codeHash').notNull().unique(),
    usedAt: integer('usedAt', { mode: 'timestamp_ms' }),
    createdAt: integer('createdAt', { mode: 'timestamp_ms' })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => [index('TotpBackupCode_userId_idx').on(table.userId)],
);

export const loginEvent = sqliteTable(
  'LoginEvent',
  {
    id: text('id').primaryKey(),
    userId: text('userId')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    ipAddress: text('ipAddress'),
    userAgent: text('userAgent'),
    createdAt: integer('createdAt', { mode: 'timestamp_ms' })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => [index('LoginEvent_userId_idx').on(table.userId)],
);

export const securityEvent = sqliteTable(
  'SecurityEvent',
  {
    id: text('id').primaryKey(),
    userId: text('userId')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    eventType: text('eventType').notNull(),
    ipAddress: text('ipAddress'),
    userAgent: text('userAgent'),
    createdAt: integer('createdAt', { mode: 'timestamp_ms' })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => [index('SecurityEvent_userId_idx').on(table.userId)],
);

export const session = sqliteTable(
  'Session',
  {
    id: text('id').primaryKey(),
    userId: text('userId')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    userAgent: text('userAgent'),
    ipAddress: text('ipAddress'),
    deviceLabel: text('deviceLabel'),
    location: text('location'),
    lastUsedAt: integer('lastUsedAt', { mode: 'timestamp_ms' })
      .notNull()
      .$defaultFn(() => new Date()),
    createdAt: integer('createdAt', { mode: 'timestamp_ms' })
      .notNull()
      .$defaultFn(() => new Date()),
    expiresAt: integer('expiresAt', { mode: 'timestamp_ms' }).notNull(),
    revokedAt: integer('revokedAt', { mode: 'timestamp_ms' }),
    currentRefreshTokenId: text('currentRefreshTokenId'),
    previousRefreshTokenId: text('previousRefreshTokenId'),
    previousRotatedAt: integer('previousRotatedAt', { mode: 'timestamp_ms' }),
  },
  (table) => [index('Session_userId_idx').on(table.userId)],
);

export const emailVerificationToken = sqliteTable(
  'EmailVerificationToken',
  {
    id: text('id').primaryKey(),
    userId: text('userId')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    tokenHash: text('tokenHash').notNull().unique(),
    newEmail: text('newEmail'),
    expiresAt: integer('expiresAt', { mode: 'timestamp_ms' }).notNull(),
    usedAt: integer('usedAt', { mode: 'timestamp_ms' }),
    createdAt: integer('createdAt', { mode: 'timestamp_ms' })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => [index('EmailVerificationToken_userId_idx').on(table.userId)],
);

export const passwordResetToken = sqliteTable(
  'PasswordResetToken',
  {
    id: text('id').primaryKey(),
    userId: text('userId')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    tokenHash: text('tokenHash').notNull().unique(),
    expiresAt: integer('expiresAt', { mode: 'timestamp_ms' }).notNull(),
    usedAt: integer('usedAt', { mode: 'timestamp_ms' }),
    createdAt: integer('createdAt', { mode: 'timestamp_ms' })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => [index('PasswordResetToken_userId_idx').on(table.userId)],
);

export const backupEmailVerificationToken = sqliteTable(
  'BackupEmailVerificationToken',
  {
    id: text('id').primaryKey(),
    userId: text('userId')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    tokenHash: text('tokenHash').notNull().unique(),
    newBackupEmail: text('newBackupEmail').notNull(),
    expiresAt: integer('expiresAt', { mode: 'timestamp_ms' }).notNull(),
    usedAt: integer('usedAt', { mode: 'timestamp_ms' }),
    createdAt: integer('createdAt', { mode: 'timestamp_ms' })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => [index('BackupEmailVerificationToken_userId_idx').on(table.userId)],
);
