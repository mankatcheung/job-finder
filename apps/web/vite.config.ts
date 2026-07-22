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
  plugins: [devtools(), tailwindcss(), tanstackStart(), nitro(), viteReact()],
  server: {
    proxy: {
      '/graphql': { target: 'http://localhost:3001', changeOrigin: true },
    },
  },
});

export default config;
