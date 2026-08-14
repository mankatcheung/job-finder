import Fastify from 'fastify';
import { buildApp } from '#src/http/buildApp.js';
import { startObservability } from '#src/infrastructure/observability/tracing.js';
import { ENV, NODE_ENV } from '#src/constants.js';

startObservability();

// Constructed here, not inside buildApp(), so this file keeps a literal
// `import fastify` + constructor call — Vercel's zero-config Fastify build
// detection scans the entrypoint for exactly that to know how to wrap the
// serverless function; buildApp() takes the instance as a parameter instead
// of constructing its own (see buildApp.ts's own comment for the failure
// this avoids).
const fastify = Fastify({
  logger: {
    level: process.env[ENV.NODE_ENV] === NODE_ENV.PRODUCTION ? 'warn' : 'info',
  },
});

await buildApp(fastify);

const port = Number(process.env[ENV.PORT] ?? 3001);

// Callback form, deliberately NOT `await`ed. Vercel's launcher imports this
// module and intercepts `listen()` to capture the server rather than truly
// binding it, so Fastify's ready callback never fires under that runtime.
// Awaiting it at the top level leaves the module permanently unresolved and
// every request hangs with no response on any path. This matches Vercel's
// documented Fastify entrypoint, which calls `listen()` as a bare statement.
fastify.listen({ port, host: '0.0.0.0' }, (err) => {
  if (err) {
    fastify.log.error(err);
    process.exit(1);
  }
  console.log(`API server listening on http://localhost:${port}`);
  console.log(`GraphiQL available at http://localhost:${port}/graphiql`);
});
