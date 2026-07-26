import path from 'node:path';
import type { PrismaConfig } from 'prisma';
import { PrismaLibSQL } from '@prisma/adapter-libsql';

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

/**
 * Without this, `prisma migrate`/`db push`/etc. use Prisma's native SQLite
 * connector, which only understands local `file:` URLs — it cannot talk to
 * a remote Turso database directly (fails with P1012, "the URL must start
 * with the protocol `file:`"). This wires the same libSQL driver adapter
 * the app's runtime client uses (infrastructure/db/client.ts) into the CLI
 * too, so migrate commands work against both local SQLite (DATABASE_URL=
 * file:...) and production Turso (DATABASE_URL=libsql://..., plus
 * DATABASE_AUTH_TOKEN) without any other changes.
 */
export default {
  experimental: {
    adapter: true,
  },
  engine: 'js',
  schema: path.join('prisma', 'schema.prisma'),
  async adapter() {
    return new PrismaLibSQL({
      url: process.env.DATABASE_URL!,
      authToken: process.env.DATABASE_AUTH_TOKEN ?? undefined,
    });
  },
} satisfies PrismaConfig;
