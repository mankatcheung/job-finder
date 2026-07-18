import { resolve } from 'path';
import { defineConfig } from 'vitest/config';
import viteReact from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [viteReact()],
  resolve: {
    alias: {
      '#/': resolve(import.meta.dirname, 'src') + '/',
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/__tests__/setup.ts'],
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/**/*.ts', 'src/**/*.tsx'],
      exclude: [
        'src/**/*.test.ts',
        'src/**/*.test.tsx',
        'src/graphql/generated/**',
        'src/routeTree.gen.ts',
        'src/router.tsx',
        'src/routes/__root.tsx',
        'src/routes/index.tsx',
        'src/lib/queryClient.ts',
      ],
    },
  },
});
