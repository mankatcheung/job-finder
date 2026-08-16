import path from 'node:path';
import { defineConfig } from 'drizzle-kit';
import { config as loadEnv } from 'dotenv';

// `db:generate`/`db:push`/`db:studio` only work here against a local `file:`
// DATABASE_URL. `db:migrate` (drizzle-kit migrate) does support a remote
// libsql:// Turso URL directly — unlike Prisma 7's CLI, drizzle-kit's
// migrator connects through the same libsql client used at runtime, so
// applying generated migrations to Turso in production works with this same
// config (see README for the deploy step).
// No explicit `path` option: dotenv's own default (`process.cwd() + '.env'`)
// is what we want here, and is actually more reliable than resolving off
// `import.meta.dirname` — drizzle-kit loads this file through its own
// loader, under which `import.meta.dirname` comes back `undefined` (this
// was a real, silent bug in the `process.loadEnvFile()` version this
// replaces: `path.join(undefined, '.env')` threw, and the try/catch around
// it swallowed that thrown error identically to a genuinely-missing-file
// case, silently no-op'ing .env loading here on every drizzle-kit
// invocation). `pnpm --filter @trakwyn/api db:generate`/etc. always run
// with cwd set to this package directory, so the default resolves
// correctly. dotenv itself silently no-ops if no .env file is found (e.g.
// CI, where env vars are expected to already be set).
loadEnv();

const databaseUrl = process.env.DATABASE_URL ?? 'file:./local.db';
const isLocalFile = databaseUrl.startsWith('file:');

// drizzle-kit's 'turso' dialect requires an authToken even though local file:
// URLs don't actually use it. Provide a harmless local-only token so the same
// config works for both local SQLite files and remote Turso databases.
const localCredentials = { url: databaseUrl, authToken: 'local' };
const remoteCredentials = {
  url: databaseUrl,
  authToken: process.env.DATABASE_AUTH_TOKEN,
};

export default defineConfig({
  dialect: 'turso',
  schema: path.join('src', 'infrastructure', 'db', 'schema.ts'),
  out: path.join('drizzle'),
  dbCredentials: isLocalFile ? localCredentials : remoteCredentials,
});
