import { describe, it, expect, vi } from 'vitest';
import {
  bootstrapSchema,
  describeTarget,
  findUserTables,
  readDatabaseEnv,
  SchemaBootstrapError,
  type SchemaTarget,
} from '#src/infrastructure/db/schemaBootstrap.js';

/**
 * Fake target backed by an in-memory list of table names. `executeMultiple`
 * doesn't parse SQL — it just records the call and reports whichever tables
 * the test says the apply produced.
 */
function createFakeTarget(options: { tables?: string[]; createsTables?: string[] } = {}): {
  target: SchemaTarget;
  executed: string[];
  closed: () => boolean;
} {
  let tables = options.tables ?? [];
  const executed: string[] = [];
  let isClosed = false;

  return {
    executed,
    closed: () => isClosed,
    target: {
      listTableNames: () => Promise.resolve([...tables]),
      executeMultiple: (sql: string) => {
        executed.push(sql);
        tables = [...tables, ...(options.createsTables ?? [])];
        return Promise.resolve();
      },
      close: () => {
        isClosed = true;
      },
    },
  };
}

describe('readDatabaseEnv', () => {
  it('throws when DATABASE_URL is absent', () => {
    expect(() => readDatabaseEnv({})).toThrow(SchemaBootstrapError);
    expect(() => readDatabaseEnv({})).toThrow(/DATABASE_URL/);
  });

  it('throws when DATABASE_URL is blank', () => {
    expect(() => readDatabaseEnv({ DATABASE_URL: '   ' })).toThrow(/DATABASE_URL/);
  });

  it('returns url and auth token for a remote libsql target', () => {
    expect(
      readDatabaseEnv({ DATABASE_URL: 'libsql://db-org.turso.io', DATABASE_AUTH_TOKEN: 'tok' }),
    ).toEqual({ url: 'libsql://db-org.turso.io', authToken: 'tok' });
  });

  it('requires an auth token for remote targets', () => {
    expect(() => readDatabaseEnv({ DATABASE_URL: 'libsql://db-org.turso.io' })).toThrow(
      /DATABASE_AUTH_TOKEN/,
    );
    expect(() => readDatabaseEnv({ DATABASE_URL: 'https://db-org.turso.io' })).toThrow(
      /DATABASE_AUTH_TOKEN/,
    );
  });

  it('allows a local file target with no auth token', () => {
    expect(readDatabaseEnv({ DATABASE_URL: 'file:/tmp/local.db' })).toEqual({
      url: 'file:/tmp/local.db',
      authToken: undefined,
    });
  });
});

describe('describeTarget', () => {
  it('keeps a plain libsql host readable', () => {
    expect(describeTarget('libsql://job-finder-org.turso.io')).toBe(
      'libsql://job-finder-org.turso.io',
    );
  });

  it('strips a query string that may carry an auth token', () => {
    expect(describeTarget('libsql://job-finder-org.turso.io?authToken=secret')).toBe(
      'libsql://job-finder-org.turso.io',
    );
  });

  it('strips embedded credentials', () => {
    expect(describeTarget('libsql://user:pw@job-finder-org.turso.io')).toBe(
      'libsql://job-finder-org.turso.io',
    );
  });

  it('passes through a file url unchanged', () => {
    expect(describeTarget('file:/tmp/local.db')).toBe('file:/tmp/local.db');
  });
});

describe('findUserTables', () => {
  it('ignores sqlite internal tables', () => {
    expect(findUserTables(['sqlite_sequence', 'sqlite_stat1', 'User'])).toEqual(['User']);
  });

  it('ignores libsql internal tables', () => {
    expect(findUserTables(['libsql_wasm_func_table', 'User'])).toEqual(['User']);
  });

  it('returns an empty list for a pristine database', () => {
    expect(findUserTables(['sqlite_sequence'])).toEqual([]);
  });
});

describe('bootstrapSchema', () => {
  const sql = 'CREATE TABLE "User" ("id" TEXT NOT NULL PRIMARY KEY);';

  it('applies the SQL against an empty database and reports the tables created', async () => {
    const { target, executed } = createFakeTarget({
      tables: ['sqlite_sequence'],
      createsTables: ['User', 'Document'],
    });

    const result = await bootstrapSchema({ target, sql });

    expect(executed).toEqual([sql]);
    expect(result.tables).toEqual(['Document', 'User']);
  });

  it('refuses to run against a database that already has tables', async () => {
    const { target, executed } = createFakeTarget({ tables: ['User'] });

    await expect(bootstrapSchema({ target, sql })).rejects.toThrow(SchemaBootstrapError);
    expect(executed).toEqual([]);
  });

  it('names the existing tables in the refusal so the mistake is obvious', async () => {
    const { target } = createFakeTarget({ tables: ['User', 'Document'] });

    await expect(bootstrapSchema({ target, sql })).rejects.toThrow(/Document, User/);
  });

  it('applies anyway when force is set', async () => {
    const { target, executed } = createFakeTarget({ tables: ['User'] });

    await bootstrapSchema({ target, sql, force: true });

    expect(executed).toEqual([sql]);
  });

  it('rejects empty SQL before touching the database', async () => {
    const { target, executed } = createFakeTarget();

    await expect(bootstrapSchema({ target, sql: '   \n' })).rejects.toThrow(/empty/i);
    expect(executed).toEqual([]);
  });

  it('reports progress through the supplied logger', async () => {
    const { target } = createFakeTarget({ createsTables: ['User'] });
    const log = vi.fn();

    await bootstrapSchema({ target, sql, log });

    expect(log).toHaveBeenCalled();
  });
});
