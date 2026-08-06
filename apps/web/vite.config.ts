import { defineConfig } from 'vite';
import { devtools } from '@tanstack/devtools-vite';

import { tanstackStart } from '@tanstack/react-start/plugin/vite';
import { nitro } from 'nitro/vite';

import viteReact from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

const config = defineConfig(({ command }) => ({
  resolve: { tsconfigPaths: true },
  plugins: [
    devtools(),
    tailwindcss(),
    // `router.semicolons` matches this repo's Prettier style (`semi: true`)
    // — without it, the generator's own default (no semicolons) means the
    // committed routeTree.gen.ts perpetually diffs against what `pnpm dev`/
    // `pnpm build` regenerate. tsr.config.json alone does NOT cover this:
    // this plugin resolves its own router config independently and does not
    // read that file for the dev/build code path.
    tanstackStart({ router: { semicolons: true } }),
    // nitro() enables platform-targeted build output (Vercel, Netlify, etc.) —
    // without it, `vite build` only emits a generic dist/server/server.js
    // fetch handler with no adapter for any specific hosting platform.
    // preset: 'vercel' is explicit, not auto-detected — this nitro version
    // (unlike unjs/nitropack, which Nuxt uses) has no VERCEL=1 auto-detection,
    // confirmed by a real `vercel build` run producing a generic .output/
    // instead of .vercel/output/ (Build Output API v3) without this.
    // Restricted to `build`: nitro also resolves 'vercel' to its 'vercel-dev'
    // alias for `vite dev`, emulating the Vercel runtime locally — skipped
    // here so `pnpm dev` runs as a plain local dev server instead.
    ...(command === 'build' ? [nitro({ preset: 'vercel' })] : []),
    viteReact(),
  ],
  server: {
    proxy: {
      '/graphql': { target: 'http://localhost:3001', changeOrigin: true },
      '/auth': { target: 'http://localhost:3001', changeOrigin: true },
    },
  },
}));

export default config;
