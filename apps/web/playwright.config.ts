import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  retries: process.env.CI ? 2 : 0,
  // Every spec shares one dev API server + one local SQLite file — running
  // spec files in parallel overloads that single server (tests pass in
  // isolation but fail/timeout en masse when several files run at once).
  workers: 1,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: [
    {
      command: 'pnpm --filter @trakwyn/api dev',
      url: 'http://localhost:3001/graphql',
      reuseExistingServer: !process.env.CI,
      timeout: 30_000,
    },
    {
      command: 'pnpm --filter @trakwyn/web dev',
      url: 'http://localhost:3000',
      reuseExistingServer: !process.env.CI,
      timeout: 30_000,
    },
  ],
});
