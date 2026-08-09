import { createClient } from '@libsql/client';
import Fastify, { type FastifyInstance } from 'fastify';
import { unlinkSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { randomUUID } from 'node:crypto';
import { ENV } from '#src/constants.js';
import { applyMigrations } from '#src/infrastructure/db/applyMigrations.js';

export interface TestApp {
  app: FastifyInstance;
  cleanup: () => Promise<void>;
}

/**
 * Builds a real, fully-wired Fastify app (`buildApp()`) against a fresh,
 * isolated temp-file SQLite DB with the real migrations applied — for
 * GraphQL/HTTP integration tests driven via `app.inject()`.
 *
 * `infrastructure/db/client.ts` constructs its singleton libsql client at
 * module-evaluation time from `process.env.DATABASE_URL`, so `DATABASE_URL`
 * must be set — and `buildApp`/`buildContainer` dynamically imported — before
 * that module is ever evaluated (same approach `__tests__/http/container.test.ts`
 * already uses). This relies on Vitest's default per-test-file module
 * isolation: call this once per test file (in `beforeAll`), not per `it()` —
 * a second call within the same file would hit the already-cached
 * `client.ts` module and silently keep talking to the first call's temp DB.
 */
export async function buildTestApp(): Promise<TestApp> {
  const dbPath = join(tmpdir(), `job-finder-integration-${randomUUID()}.db`);
  const databaseUrl = `file:${dbPath}`;

  // Apply the real migrations via a throwaway client before the app's own
  // singleton client ever connects — so the schema matches production
  // exactly, with no hand-maintained duplicate DDL to keep in sync.
  const migrationClient = createClient({ url: databaseUrl });
  await applyMigrations(migrationClient);
  migrationClient.close();

  process.env[ENV.DATABASE_URL] = databaseUrl;
  process.env[ENV.JWT_SECRET] ??= 'test-secret';
  process.env[ENV.JWT_REFRESH_SECRET] ??= 'test-refresh-secret';

  const { buildApp } = await import('#src/http/buildApp.js');
  // Logger disabled — buildApp() otherwise logs every request at 'info',
  // which is just noise across dozens of requests per integration test file.
  const app = await buildApp(Fastify({ logger: false }));
  await app.ready();

  return {
    app,
    cleanup: async () => {
      await app.close();
      if (existsSync(dbPath)) unlinkSync(dbPath);
    },
  };
}
