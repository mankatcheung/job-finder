import path from 'node:path';
import { defineConfig, env } from 'prisma/config';

// Presence of this file makes the Prisma CLI skip its own automatic .env
// loading entirely, so it's done explicitly here instead (matching the
// native --env-file approach the rest of this app's scripts already use,
// rather than adding a dotenv dependency). Missing in CI, which sets env
// vars directly — that's fine, hence the guard.
try {
  process.loadEnvFile(path.join(import.meta.dirname, '.env'));
} catch {
  // no .env file present (e.g. CI) — env vars are expected to already be set
}

// Note: `migrate`/`db push` only work here against a `file:` DATABASE_URL.
// Prisma 7 removed the CLI-side driver-adapter hook that let these commands
// reach a remote Turso database directly over libsql:// (attempting it fails
// with P1013, "scheme not recognized") — the runtime PrismaClient in
// infrastructure/db/client.ts is unaffected since it takes its adapter
// directly, not through this config. To change the production schema: run
// `db:migrate`/`db:push` here against a local `file:` database to produce
// the migration SQL, then apply it to Turso via Turso's own CLI.
export default defineConfig({
  schema: path.join('prisma', 'schema.prisma'),
  datasource: {
    url: env('DATABASE_URL'),
  },
});
