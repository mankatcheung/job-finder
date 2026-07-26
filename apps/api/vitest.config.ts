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
    include: ['src/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/use-cases/**', 'src/interface-adapters/**', 'src/infrastructure/**'],
    },
  },
});
