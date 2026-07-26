import { defineConfig } from 'vite';
import { devtools } from '@tanstack/devtools-vite';

import { tanstackStart } from '@tanstack/react-start/plugin/vite';
import { nitro } from 'nitro/vite';

import viteReact from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

const config = defineConfig({
  resolve: { tsconfigPaths: true },
  // nitro() enables platform-targeted build output (Vercel, Netlify, etc.) —
  // without it, `vite build` only emits a generic dist/server/server.js
  // fetch handler with no adapter for any specific hosting platform.
  // preset: 'vercel' is explicit, not auto-detected — this nitro version
  // (unlike unjs/nitropack, which Nuxt uses) has no VERCEL=1 auto-detection,
  // confirmed by a real `vercel build` run producing a generic .output/
  // instead of .vercel/output/ (Build Output API v3) without this. Also
  // covers local dev correctly: nitro resolves 'vercel' to its 'vercel-dev'
  // alias automatically when running the dev server.
  plugins: [devtools(), tailwindcss(), tanstackStart(), nitro({ preset: 'vercel' }), viteReact()],
  server: {
    proxy: {
      '/graphql': { target: 'http://localhost:3001', changeOrigin: true },
      '/auth': { target: 'http://localhost:3001', changeOrigin: true },
    },
  },
});

export default config;
