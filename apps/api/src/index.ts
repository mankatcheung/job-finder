import { buildApp } from '#src/http/buildApp.js';
import { ENV } from '#src/constants.js';

// startObservability();

const fastify = await buildApp();

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
