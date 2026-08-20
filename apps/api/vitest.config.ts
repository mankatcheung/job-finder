import { resolve } from 'path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '#src/': resolve(import.meta.dirname, 'src') + '/',
    },
  },
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./src/__tests__/setupEnv.ts'],
    include: ['src/**/*.test.ts'],
    // Vitest defaults to 5s, which suits the unit tests — they finish in
    // milliseconds and are unaffected by a higher ceiling. It does not suit
    // the integration tests, which drive a real Fastify app over a real
    // SQLite file and deliberately-slow password hashing: registering two
    // users and walking an OAuth flow costs ~3-5s unloaded, and CI runs the
    // whole suite in parallel on a shared runner. They were passing on the
    // margin and failing whenever the runner was busy, which reads as
    // flakiness but is really a limit set for a suite this one outgrew.
    // `beforeAll(..., 30_000)` in the MCP integration file already conceded
    // the point locally; this generalises it.
    testTimeout: 20_000,
    hookTimeout: 30_000,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/use-cases/**', 'src/interface-adapters/**', 'src/infrastructure/**'],
    },
  },
});
