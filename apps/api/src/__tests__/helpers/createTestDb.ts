import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import { unlinkSync, existsSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { randomUUID } from 'crypto';
import * as schema from '#src/infrastructure/db/schema.js';
import type { DrizzleDb } from '#src/infrastructure/db/client.js';
import { applyMigrations } from '#src/infrastructure/db/applyMigrations.js';

export interface TestDb {
  db: DrizzleDb;
  cleanup: () => Promise<void>;
}

/**
 * A fresh, isolated SQLite database per caller, built by running the **real
 * migrations** — the same ones production runs, and the same thing
 * `integration/helpers/buildTestApp.ts` does.
 *
 * This used to execute a hand-written list of `CREATE TABLE` statements kept
 * alongside the schema, which meant two definitions to keep in step. Adding a
 * table left repository tests failing with `no such table` until the DDL was
 * copied into a second place (JEF-195), and a subtler divergence — a missing
 * `NOT NULL`, a different default — would have gone unnoticed while tests
 * passed against a laxer schema than production has. Running the migrations
 * costs about 20ms more per database and makes the drift impossible (JEF-201).
 *
 * Call this once per test file (in `beforeAll`), not per `it()`.
 */
export async function createTestDb(): Promise<TestDb> {
  const dbPath = join(tmpdir(), `trakwyn-test-${randomUUID()}.db`);
  const client = createClient({ url: `file:${dbPath}` });

  // libsql does not enforce foreign keys unless asked, and without this every
  // `ON DELETE CASCADE` in the suite silently no-ops — the same reason
  // `infrastructure/db/client.ts` sets it. Applied before the migrations so
  // their own foreign keys are live from the start.
  await client.execute('PRAGMA foreign_keys = ON');

  await applyMigrations(client);

  const db = drizzle(client, { schema }) as DrizzleDb;

  return {
    db,
    cleanup: async () => {
      client.close();
      if (existsSync(dbPath)) unlinkSync(dbPath);
    },
  };
}
