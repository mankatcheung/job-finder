// Must be the first import: several DI registrations (e.g. the Redis client
// used by RedisCache/RedisRateLimiter) are constructed eagerly at
// module-load time when buildApp() below is imported, reading process.env
// as they go — dotenv/config's side effect has to run before any of that.
import 'dotenv/config';
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
  // Vercel's edge terminates TLS and forwards to this function over what
  // Node sees as a plain connection, setting X-Forwarded-Proto/-Host to
  // record the original request. Without trustProxy, Fastify's
  // request.protocol ignores those and falls back to the raw socket's
  // encryption state — always 'http' here — so oauth.routes.ts's
  // callbackUrl() built redirect_uri as http://api.trakwyn.com/... instead
  // of https://..., which GitHub/Google reject outright ("redirect_uri is
  // not associated with this application") since it must match the
  // registered callback URL exactly, scheme included.
  trustProxy: true,
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
