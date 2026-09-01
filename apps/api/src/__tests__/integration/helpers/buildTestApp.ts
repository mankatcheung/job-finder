import { createClient } from '@libsql/client';
import Fastify, { type FastifyInstance } from 'fastify';
import { unlinkSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { randomUUID } from 'node:crypto';
import { ENV } from '#src/infrastructure/config/constants.js';
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
  const dbPath = join(tmpdir(), `trakwyn-integration-${randomUUID()}.db`);
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
  // Needed by any integration test that saves an LLM API key (LlmApiKeyCipher
  // throws without it) — set here rather than per-test-file so it's not a
  // surprise the next time an integration test starts touching this path.
  process.env[ENV.LLM_API_KEY_ENCRYPTION_KEY] ??= 'test-llm-api-key-encryption-key';

  const { buildApp } = await import('#src/http/buildApp.js');
  // Logger disabled — buildApp() otherwise logs every request at 'info',
  // which is just noise across dozens of requests per integration test file.
  // trustProxy mirrors index.ts's production Fastify instance (this helper
  // deliberately doesn't import index.ts itself — it has side-effecting
  // top-level fastify.listen()) — needed so tests can exercise
  // X-Forwarded-Proto-dependent behavior like oauth.routes.ts's
  // redirect_uri construction.
  const app = await buildApp(Fastify({ logger: false, trustProxy: true }));
  await app.ready();

  return {
    app,
    cleanup: async () => {
      await app.close();
      if (existsSync(dbPath)) unlinkSync(dbPath);
    },
  };
}
