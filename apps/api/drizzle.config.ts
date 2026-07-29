import path from 'node:path';
import { defineConfig } from 'drizzle-kit';

// `db:generate`/`db:push`/`db:studio` only work here against a local `file:`
// DATABASE_URL. `db:migrate` (drizzle-kit migrate) does support a remote
// libsql:// Turso URL directly — unlike Prisma 7's CLI, drizzle-kit's
// migrator connects through the same libsql client used at runtime, so
// applying generated migrations to Turso in production works with this same
// config (see README for the deploy step).
try {
  process.loadEnvFile(path.join(import.meta.dirname, '.env'));
} catch {
  // no .env file present (e.g. CI) — env vars are expected to already be set
}

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
