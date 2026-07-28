// Deliberately reduced to the `/health` endpoint only, as a clean baseline for
// verifying the Vercel deployment pipeline end to end. Everything else — the
// GraphQL server, the Awilix container, auth/cookies, CORS, OpenTelemetry and
// the MCP/OAuth/reminders/digest routes — is untouched in the codebase and can
// be reintroduced a piece at a time once this deploys and responds.
//
// Two things here are load-bearing for the deployment and must not be
// "simplified" away:
//   1. The literal `from 'fastify'` import below. Vercel's Fastify preset picks
//      the entrypoint by regex-scanning this file's source text for it; the
//      scan does not follow imports, so moving the Fastify construction into a
//      module would break entrypoint detection.
//   2. The `#src/…` imports. They resolve to `./dist/*` in production (via the
//      `imports` map in package.json), so keeping them means this smoke test
//      actually exercises the compiled-output wiring rather than trivially
//      passing with a zero-dependency handler.
import Fastify from 'fastify';

// Type-only, emits nothing at runtime. `@fastify/cookie` and `@fastify/awilix`
// declaration-merge `cookies`/`setCookie` onto FastifyRequest/FastifyReply and
// `diScope` onto FastifyRequest, and several modules under http/adapters rely
// on those properties. Until this file registered both plugins, which is what
// pulled the augmentations into the program; dropping the registrations broke
// `tsc` for four unrelated files. These two lines restore just the types.
// Delete them when the plugins are registered again.
import type {} from '@fastify/cookie';
import type {} from '@fastify/awilix';

import { registerRoutes } from '#src/http/adapters/fastify/registerRoutes.js';
import { healthRoutes } from '#src/http/routes/health.routes.js';
import { ENV, NODE_ENV } from '#src/constants.js';

const fastify = Fastify({
  logger: {
    level: process.env[ENV.NODE_ENV] === NODE_ENV.PRODUCTION ? 'warn' : 'info',
  },
});

registerRoutes(fastify, healthRoutes());

const port = Number(process.env[ENV.PORT] ?? 3001);

// Callback form, deliberately NOT `await`ed — this matches Vercel's documented
// Fastify entrypoint, which calls `fastify.listen(...)` as a bare top-level
// statement. Vercel's launcher imports this module and intercepts `listen()` to
// capture the server rather than truly binding it, so Fastify's ready callback
// may never fire under that runtime. Awaiting it at the top level would then
// leave the module permanently unresolved and every invocation would hang.
fastify.listen({ port, host: '0.0.0.0' }, (err) => {
  if (err) {
    fastify.log.error(err);
    process.exit(1);
  }
  console.log(`API server listening on http://localhost:${port}`);
});
