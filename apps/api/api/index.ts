import type { IncomingMessage, ServerResponse } from 'node:http';
import type { FastifyInstance } from 'fastify';

// Vercel's Node.js function runtime invokes this handler per-request; Fastify
// normally owns the whole process via `.listen()` (see src/index.ts, used for
// local dev / any non-Vercel deploy target). Here we build the app once and
// reuse it across warm invocations, feeding each request into Fastify's
// underlying http.Server directly instead of listening on a port.
let appPromise: Promise<FastifyInstance> | undefined;

async function getApp(): Promise<FastifyInstance> {
  if (!appPromise) {
    appPromise = (async () => {
      // Dynamic imports (not static ones) so startObservability() runs before
      // app.js is evaluated — see src/index.ts for why this ordering matters.
      const { startObservability } = await import('../src/infrastructure/observability/tracing.js');
      startObservability();
      const { buildApp } = await import('../src/app.js');
      const app = await buildApp();
      await app.ready();
      return app;
    })();
  }
  return appPromise;
}

export default async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const app = await getApp();
  app.server.emit('request', req, res);
}
