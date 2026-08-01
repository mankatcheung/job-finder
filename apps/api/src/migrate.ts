#!/usr/bin/env tsx
/**
 * Custom migration runner that applies Drizzle SQL migrations using
 * `@libsql/client` (which supports WebSocket connections to Turso), ensuring
 * DDL statements are reliably executed against remote Turso databases.
 *
 * `drizzle-kit migrate` with `dialect: 'turso'` connects over HTTP only.
 * Turso's HTTP API silently drops DDL statements that contain foreign-key
 * references, so multi-table CREATE TABLE migrations appear to succeed
 * (the `__drizzle_migrations` tracking row is written) but the tables are
 * never actually created.
 *
 * This script uses the same `@libsql/client` that the runtime uses, which
 * negotiates WebSocket when available and reliably executes DDL.
 *
 * Migration history is preserved in the standard `__drizzle_migrations`
 * table so `drizzle-kit migrate` can still read it later if needed.
 *
 * Usage:
 *   DATABASE_URL=libsql://... DATABASE_AUTH_TOKEN=... pnpm db:migrate:apply
 */

import { createClient } from '@libsql/client';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { createHash } from 'node:crypto';

const DATABASE_URL = process.env.DATABASE_URL;
const DATABASE_AUTH_TOKEN = process.env.DATABASE_AUTH_TOKEN;

if (!DATABASE_URL) {
  console.error('DATABASE_URL is required');
  process.exit(1);
}

const MIGRATIONS_DIR = join(import.meta.dirname, '..', 'drizzle');
const JOURNAL_PATH = join(MIGRATIONS_DIR, 'meta', '_journal.json');

if (!existsSync(JOURNAL_PATH)) {
  console.error('Migration journal not found at', JOURNAL_PATH);
  process.exit(1);
}

interface JournalEntry {
  idx: number;
  version: string;
  when: number;
  tag: string;
  breakpoints: boolean;
}

interface Journal {
  version: string;
  dialect: string;
  entries: JournalEntry[];
}

const journal: Journal = JSON.parse(readFileSync(JOURNAL_PATH, 'utf-8'));
const entries = [...journal.entries].sort((a, b) => a.idx - b.idx);

console.log(`Found ${entries.length} migrations in journal\n`);

const client = createClient({
  url: DATABASE_URL,
  authToken: DATABASE_AUTH_TOKEN ?? undefined,
});

// libsql does not enforce foreign keys by default — must be enabled explicitly
// so ON DELETE CASCADE works. Applied here so migrations that add FK
// constraints will have them enforced correctly.
await client.execute('PRAGMA foreign_keys = ON');

// Ensure the tracking table exists
await client.execute(`
  CREATE TABLE IF NOT EXISTS __drizzle_migrations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    hash TEXT UNIQUE,
    created_at BIGINT
  )
`);

// Load already-applied hashes
const appliedResult = await client.execute('SELECT hash FROM __drizzle_migrations');
const appliedHashes = new Set(appliedResult.rows.map((row) => String(row.hash)));

let applied = 0;
let skipped = 0;

for (const entry of entries) {
  const sqlPath = join(MIGRATIONS_DIR, `${entry.tag}.sql`);

  if (!existsSync(sqlPath)) {
    console.error(`  ✗ Migration file not found: ${sqlPath}`);
    process.exit(1);
  }

  const sql = readFileSync(sqlPath, 'utf-8');
  // SHA-256 hash of the SQL content.  drizzle-kit uses a different (proprietary)
  // hash internally, so hashes computed here will NOT match any hashes that
  // `drizzle-kit migrate` may have written previously.  This is intentional —
  // it ensures migrations that drizzle-kit recorded but failed to apply
  // (the original Turso HTTP bug) are still re-attempted by this script.
  const hash = createHash('sha256').update(sql).digest('hex');

  if (appliedHashes.has(hash)) {
    console.log(`  ⏭  ${entry.tag} (already applied)`);
    skipped++;
    continue;
  }

  console.log(`  ▶  ${entry.tag}...`);

  // drizzle-kit separates statements with this marker
  const statements = sql
    .split('--> statement-breakpoint')
    .map((s) => s.trim())
    .filter(Boolean);

  for (const stmt of statements) {
    try {
      await client.execute(stmt);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      // If a table/index already exists then a previous migration run
      // (e.g. drizzle-kit migrate) recorded the migration without actually
      // creating the objects, or the migration was applied by an earlier
      // run of this script.  Either way, the DDL is safe to skip.
      if (msg.includes('already exists') || msg.includes('duplicate column name')) {
        console.log(`    (already exists, skipping: ${stmt.slice(0, 80)}…)`);
        continue;
      }
      throw err;
    }
  }

  // Record the migration so future runs skip it
  await client.execute({
    sql: 'INSERT INTO __drizzle_migrations (hash, created_at) VALUES (?, ?)',
    args: [hash, Date.now()],
  });

  applied++;
  console.log(`    ✓ done`);
}

console.log(`\nMigrations complete: ${applied} applied, ${skipped} skipped`);
