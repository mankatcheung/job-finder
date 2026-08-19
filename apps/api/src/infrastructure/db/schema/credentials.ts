import { sqliteTable, text, integer, index, uniqueIndex } from 'drizzle-orm/sqlite-core';
import { user } from './user.js';

export const llmApiKey = sqliteTable(
  'LlmApiKey',
  {
    id: text('id').primaryKey(),
    userId: text('userId')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    /** See LLM_PROVIDER in constants.ts. One row per user per provider. */
    provider: text('provider').notNull(),
    /** Encrypted at rest (never returned to the client). */
    apiKey: text('apiKey').notNull(),
    /** Model override; required when provider is 'custom', optional elsewhere. */
    model: text('model'),
    /** Base URL; only used (and required) when provider is 'custom'. */
    baseUrl: text('baseUrl'),
    createdAt: integer('createdAt', { mode: 'timestamp_ms' })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: integer('updatedAt', { mode: 'timestamp_ms' })
      .notNull()
      .$defaultFn(() => new Date())
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index('LlmApiKey_userId_idx').on(table.userId),
    uniqueIndex('LlmApiKey_userId_provider_key').on(table.userId, table.provider),
  ],
);

export const apiToken = sqliteTable(
  'ApiToken',
  {
    id: text('id').primaryKey(),
    userId: text('userId')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    tokenHash: text('tokenHash').notNull().unique(),
    scope: text('scope').notNull().default('full'),
    lastUsedAt: integer('lastUsedAt', { mode: 'timestamp_ms' }),
    createdAt: integer('createdAt', { mode: 'timestamp_ms' })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => [index('ApiToken_userId_idx').on(table.userId)],
);

export const mcpOAuthAccessToken = sqliteTable(
  'McpOAuthAccessToken',
  {
    id: text('id').primaryKey(),
    userId: text('userId')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    clientId: text('clientId').notNull(),
    tokenHash: text('tokenHash').notNull().unique(),
    scope: text('scope').notNull(),
    audience: text('audience').notNull(),
    expiresAt: integer('expiresAt', { mode: 'timestamp_ms' }).notNull(),
    revokedAt: integer('revokedAt', { mode: 'timestamp_ms' }),
    lastUsedAt: integer('lastUsedAt', { mode: 'timestamp_ms' }),
    createdAt: integer('createdAt', { mode: 'timestamp_ms' })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => [
    index('McpOAuthAccessToken_userId_idx').on(table.userId),
    index('McpOAuthAccessToken_clientId_idx').on(table.clientId),
    index('McpOAuthAccessToken_expiresAt_idx').on(table.expiresAt),
  ],
);

export const mcpOAuthClient = sqliteTable(
  'McpOAuthClient',
  {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    redirectUris: text('redirectUris').notNull(),
    revokedAt: integer('revokedAt', { mode: 'timestamp_ms' }),
    createdAt: integer('createdAt', { mode: 'timestamp_ms' })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => [index('McpOAuthClient_createdAt_idx').on(table.createdAt)],
);

export const mcpOAuthAuthorizationCode = sqliteTable(
  'McpOAuthAuthorizationCode',
  {
    id: text('id').primaryKey(),
    codeHash: text('codeHash').notNull().unique(),
    clientId: text('clientId')
      .notNull()
      .references(() => mcpOAuthClient.id, { onDelete: 'cascade' }),
    userId: text('userId')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    redirectUri: text('redirectUri').notNull(),
    scope: text('scope').notNull(),
    codeChallenge: text('codeChallenge').notNull(),
    codeChallengeMethod: text('codeChallengeMethod').notNull(),
    expiresAt: integer('expiresAt', { mode: 'timestamp_ms' }).notNull(),
    consumedAt: integer('consumedAt', { mode: 'timestamp_ms' }),
    createdAt: integer('createdAt', { mode: 'timestamp_ms' })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => [
    index('McpOAuthAuthorizationCode_clientId_idx').on(table.clientId),
    index('McpOAuthAuthorizationCode_userId_idx').on(table.userId),
    index('McpOAuthAuthorizationCode_expiresAt_idx').on(table.expiresAt),
  ],
);

export const mcpOAuthRefreshToken = sqliteTable(
  'McpOAuthRefreshToken',
  {
    id: text('id').primaryKey(),
    tokenHash: text('tokenHash').notNull().unique(),
    familyId: text('familyId').notNull(),
    clientId: text('clientId').notNull(),
    userId: text('userId')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    scope: text('scope').notNull(),
    expiresAt: integer('expiresAt', { mode: 'timestamp_ms' }).notNull(),
    usedAt: integer('usedAt', { mode: 'timestamp_ms' }),
    revokedAt: integer('revokedAt', { mode: 'timestamp_ms' }),
    createdAt: integer('createdAt', { mode: 'timestamp_ms' })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => [
    index('McpOAuthRefreshToken_familyId_idx').on(table.familyId),
    index('McpOAuthRefreshToken_userId_idx').on(table.userId),
    index('McpOAuthRefreshToken_expiresAt_idx').on(table.expiresAt),
  ],
);

export const shareLink = sqliteTable(
  'ShareLink',
  {
    id: text('id').primaryKey(),
    userId: text('userId')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    tokenHash: text('tokenHash').notNull().unique(),
    lastUsedAt: integer('lastUsedAt', { mode: 'timestamp_ms' }),
    createdAt: integer('createdAt', { mode: 'timestamp_ms' })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => [index('ShareLink_userId_idx').on(table.userId)],
);
