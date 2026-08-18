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
    ...(command === 'build'
      ? [
          nitro({
            preset: 'vercel',
            // Prerender the landing page at build time (JEF-169) so it's
            // emitted as .vercel/output/static/index.html. The Vercel route
            // config puts `handle: filesystem` ahead of the `/(.*) ->
            // /__server` fallback, so that file is served straight from the
            // edge — the serverless function is never invoked for `/`.
            //
            // Measured before this (JEF-168): the document returned
            // `x-vercel-cache: MISS` on every request with
            // `cache-control: max-age=0, must-revalidate`, so every
            // anonymous visit invoked the function and paid a London->
            // Virginia hop. Warm TTFB ~150 ms, one cold start at 1.18 s.
            //
            // The prerendered HTML is still the same empty shell, because
            // `/` sets `ssr: false` — TanStack Start skips server rendering
            // for it even at build time. This buys the TTFB and cold-start
            // win, not a content/SEO win; see the JEF-169 follow-up note for
            // what rendering real content would additionally require.
            routeRules: { '/': { prerender: true } },
          }),
        ]
      : []),
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
