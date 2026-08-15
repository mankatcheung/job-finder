#!/usr/bin/env tsx
/**
 * CLI entry point for applying Drizzle SQL migrations using `@libsql/client`
 * (which supports WebSocket connections to Turso), ensuring DDL statements
 * are reliably executed against remote Turso databases.
 *
 * `drizzle-kit migrate` with `dialect: 'turso'` connects over HTTP only.
 * Turso's HTTP API silently drops DDL statements that contain foreign-key
 * references, so multi-table CREATE TABLE migrations appear to succeed
 * (the `__drizzle_migrations` tracking row is written) but the tables are
 * never actually created.
 *
 * This uses the same `@libsql/client` the runtime uses, which negotiates
 * WebSocket when available and reliably executes DDL. Migration history is
 * preserved in the standard `__drizzle_migrations` table so `drizzle-kit
 * migrate` can still read it later if needed.
 *
 * The actual migration-applying logic lives in `applyMigrations.ts`, shared
 * with the integration-test DB helper (`__tests__/integration/helpers/buildTestApp.ts`).
 *
 * Usage:
 *   DATABASE_URL=libsql://... DATABASE_AUTH_TOKEN=... pnpm db:migrate:apply
 */

import 'dotenv/config';
import { createClient } from '@libsql/client';
import { applyMigrations } from '#src/infrastructure/db/applyMigrations.js';

const DATABASE_URL = process.env.DATABASE_URL;
const DATABASE_AUTH_TOKEN = process.env.DATABASE_AUTH_TOKEN;

if (!DATABASE_URL) {
  console.error('DATABASE_URL is required');
  process.exit(1);
}

const client = createClient({
  url: DATABASE_URL,
  authToken: DATABASE_AUTH_TOKEN ?? undefined,
});

await applyMigrations(client);
