import type { Client } from '@libsql/client';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { createHash } from 'node:crypto';

const MIGRATIONS_DIR = join(import.meta.dirname, '..', '..', '..', 'drizzle');
const JOURNAL_PATH = join(MIGRATIONS_DIR, 'meta', '_journal.json');

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

export interface ApplyMigrationsResult {
  applied: number;
  skipped: number;
}

/**
 * Applies every Drizzle SQL migration in `drizzle/*.sql` to `client`, using
 * the same DDL-safe execution path `pnpm db:migrate:apply` uses (see that
 * script's own header comment for why `drizzle-kit migrate` isn't used).
 *
 * Shared between the production migration CLI (`migrate.ts`) and the
 * integration-test DB helper (`buildTestApp.ts`) so both apply the real
 * migrations rather than a hand-maintained duplicate schema — the latter
 * already caused a real miss once (a table added to `createTestDb.ts`'s DDL
 * list had to be added by hand and was initially forgotten).
 */
export async function applyMigrations(client: Client): Promise<ApplyMigrationsResult> {
  if (!existsSync(JOURNAL_PATH)) {
    throw new Error(`Migration journal not found at ${JOURNAL_PATH}`);
  }

  const journal: Journal = JSON.parse(readFileSync(JOURNAL_PATH, 'utf-8'));
  const entries = [...journal.entries].sort((a, b) => a.idx - b.idx);

  console.log(`Found ${entries.length} migrations in journal\n`);

  // libsql does not enforce foreign keys by default — must be enabled
  // explicitly so ON DELETE CASCADE works. Applied here so migrations that
  // add FK constraints will have them enforced correctly.
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
      throw new Error(`Migration file not found: ${sqlPath}`);
    }

    const sql = readFileSync(sqlPath, 'utf-8');
    // SHA-256 hash of the SQL content. drizzle-kit uses a different
    // (proprietary) hash internally, so hashes computed here will NOT match
    // any hashes that `drizzle-kit migrate` may have written previously.
    // This is intentional — it ensures migrations that drizzle-kit recorded
    // but failed to apply (the original Turso HTTP bug) are still
    // re-attempted here.
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
        // run of this script. Either way, the DDL is safe to skip.
        //
        // The inverse also happens: drizzle-kit's SQLite dialect regenerates
        // DROP INDEX/DROP TABLE statements for objects whose on-disk name
        // has drifted from what the migration history expects (e.g. an
        // index that no longer exists under the name a later migration
        // expects to drop). A "no such X" on a DROP means the end state is
        // already what the migration wants, so it's equally safe to skip.
        if (
          msg.includes('already exists') ||
          msg.includes('duplicate column name') ||
          msg.includes('no such index') ||
          msg.includes('no such table') ||
          msg.includes('no such column')
        ) {
          console.log(`    (drift-tolerant skip: ${stmt.slice(0, 80)}…)`);
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
  return { applied, skipped };
}
