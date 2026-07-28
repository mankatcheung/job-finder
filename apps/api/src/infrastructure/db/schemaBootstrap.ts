import { ENV } from '#src/constants.js';

/**
 * Creates a schema in a database the Prisma CLI can't reach.
 *
 * Prisma 7 dropped the CLI-side driver-adapter hook, so `migrate deploy` and
 * `db push` fail against a remote Turso database with P1013 (see the note in
 * `prisma.config.ts`). The schema SQL is therefore generated locally with
 * `prisma migrate diff` and applied here over the same libSQL connection the
 * runtime client uses.
 */

/**
 * Table-name prefixes SQLite and libSQL manage themselves. Their presence says
 * nothing about whether the application schema has been applied, so they must
 * not trip the "database is not empty" guard.
 */
const INTERNAL_TABLE_PREFIXES = ['sqlite_', 'libsql_', '_litestream'] as const;

/** URL schemes that reach a remote server and therefore need an auth token. */
const REMOTE_URL_SCHEMES = ['libsql:', 'https:', 'wss:'] as const;

/** The minimum a database connection has to offer to receive a schema. */
export interface SchemaTarget {
  listTableNames(): Promise<string[]>;
  executeMultiple(sql: string): Promise<void>;
  close(): void;
}

export interface DatabaseCredentials {
  url: string;
  authToken: string | undefined;
}

/** Raised for every operator-facing failure, so the CLI can print it bare. */
export class SchemaBootstrapError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SchemaBootstrapError';
  }
}

/**
 * Reads and validates connection details from an environment. Kept separate
 * from `process.env` so the rules are testable and the failure messages say
 * which variable is missing rather than surfacing a driver-level error later.
 */
export function readDatabaseEnv(env: Record<string, string | undefined>): DatabaseCredentials {
  const url = env[ENV.DATABASE_URL]?.trim();
  if (!url) {
    throw new SchemaBootstrapError(
      `${ENV.DATABASE_URL} is not set. Point it at the target database, e.g. libsql://<db>-<org>.turso.io`,
    );
  }

  const authToken = env[ENV.DATABASE_AUTH_TOKEN]?.trim() || undefined;
  if (isRemoteUrl(url) && !authToken) {
    throw new SchemaBootstrapError(
      `${ENV.DATABASE_AUTH_TOKEN} is required for remote database ${describeTarget(url)}. Create one with \`turso db tokens create <db>\`.`,
    );
  }

  return { url, authToken };
}

/**
 * Renders a database URL for logging with any credential material removed —
 * a token can arrive in the query string as well as in its own variable.
 */
export function describeTarget(url: string): string {
  const withoutQuery = url.split('?')[0]!;
  const [scheme, rest] = splitScheme(withoutQuery);
  if (rest === undefined) return withoutQuery;

  // Strip `user:password@` while leaving the host untouched.
  const hostStart = rest.lastIndexOf('@');
  const host = hostStart === -1 ? rest : rest.slice(hostStart + 1);
  return `${scheme}//${host}`;
}

/** Filters engine-managed tables out of a raw `sqlite_master` listing. */
export function findUserTables(tableNames: string[]): string[] {
  return tableNames.filter(
    (name) => !INTERNAL_TABLE_PREFIXES.some((prefix) => name.startsWith(prefix)),
  );
}

export interface BootstrapSchemaOptions {
  target: SchemaTarget;
  sql: string;
  /**
   * Applies the SQL even when the database already holds tables. The SQL is a
   * from-empty snapshot, so on a populated database it will normally fail on
   * the first `CREATE TABLE` — this only exists for deliberate retries after a
   * partial apply.
   */
  force?: boolean;
  log?: (message: string) => void;
}

export interface BootstrapSchemaResult {
  /** Application tables present after the apply, sorted by name. */
  tables: string[];
}

/**
 * Applies `sql` to `target`, refusing by default if the database already has
 * application tables. Does not close the target — that stays with the caller
 * that opened it.
 */
export async function bootstrapSchema({
  target,
  sql,
  force = false,
  log = () => {},
}: BootstrapSchemaOptions): Promise<BootstrapSchemaResult> {
  if (!sql.trim()) {
    throw new SchemaBootstrapError(
      'The schema SQL is empty. Generate it first with `pnpm db:schema-sql`.',
    );
  }

  const existing = findUserTables(await target.listTableNames());
  if (existing.length > 0 && !force) {
    throw new SchemaBootstrapError(
      `Refusing to apply: the database already contains ${existing.length} table(s): ${[...existing].sort().join(', ')}. ` +
        'This script creates a schema from empty and is not a migration tool. Re-run with --force only if you are sure.',
    );
  }

  if (existing.length > 0) {
    log(`--force: applying over ${existing.length} existing table(s)`);
  }

  log('Applying schema...');
  await target.executeMultiple(sql);

  const tables = findUserTables(await target.listTableNames()).sort();
  log(`Done. ${tables.length} table(s) present.`);
  return { tables };
}

function isRemoteUrl(url: string): boolean {
  const [scheme] = splitScheme(url);
  return REMOTE_URL_SCHEMES.some((remote) => remote === scheme);
}

/** Splits `scheme://rest`, tolerating schemeless and `file:` style URLs. */
function splitScheme(url: string): [string, string | undefined] {
  const separator = url.indexOf('//');
  if (separator === -1) return [url.slice(0, url.indexOf(':') + 1), undefined];
  return [url.slice(0, separator), url.slice(separator + 2)];
}
