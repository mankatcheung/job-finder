import { createClient } from '@libsql/client';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { unlinkSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { randomUUID } from 'node:crypto';
import { describe, it, expect, afterEach } from 'vitest';
import { applyMigrations } from '#src/infrastructure/db/applyMigrations.js';

const MIGRATIONS_DIR = join(import.meta.dirname, '..', '..', '..', '..', 'drizzle');

describe('applyMigrations', () => {
  let dbPath: string;

  afterEach(() => {
    if (dbPath && existsSync(dbPath)) {
      unlinkSync(dbPath);
    }
  });

  it('tolerates an index that has already drifted away when a later migration drops it', async () => {
    dbPath = join(tmpdir(), `trakwyn-applyMigrations-test-${randomUUID()}.db`);
    const client = createClient({ url: `file:${dbPath}` });
    await client.execute('PRAGMA foreign_keys = ON');

    // Full run: reproduces production up to the point right before the
    // incident (every migration applied cleanly on a fresh database).
    const first = await applyMigrations(client);
    expect(first.applied).toBeGreaterThan(0);

    // Simulate drift: something outside the migration system removed an
    // index that a later migration's journal entry still expects to DROP by
    // name (this is what happened in production with `User_email_unique`
    // ahead of migration 0031).
    await client.execute('DROP INDEX `User_email_unique`');

    // Force the migration that drops it to be re-attempted, as if its hash
    // had never been recorded.
    const migrationFile = readFileSync(join(MIGRATIONS_DIR, '0031_optimal_luke_cage.sql'), 'utf-8');
    const hash = createHash('sha256').update(migrationFile).digest('hex');
    await client.execute({
      sql: 'DELETE FROM __drizzle_migrations WHERE hash = ?',
      args: [hash],
    });

    const second = await applyMigrations(client);

    expect(second.applied).toBe(1);
    const indexCheck = await client.execute(
      "SELECT name FROM sqlite_master WHERE type = 'index' AND name = 'User_email_unique'",
    );
    expect(indexCheck.rows).toHaveLength(1);
  });
});
