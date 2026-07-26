import { startObservability } from '#src/infrastructure/observability/tracing.js';
import { ENV } from '#src/constants.js';

startObservability();

// Dynamic import (not a static one) is required here: static imports are all
// evaluated during module linking, before any of this module's own top-level
// code runs — so a static `import { buildApp } from '#src/buildApp.js'` above
// would load fastify/http before startObservability() has a chance to patch
// them. A dynamic import() defers buildApp.js's evaluation until this line
// actually runs, i.e. after tracing is started.
const { buildApp } = await import('#src/buildApp.js');

const port = Number(process.env[ENV.PORT] ?? 3001);

const app = await buildApp();

try {
  await app.listen({ port, host: '0.0.0.0' });
  console.log(`API server listening on http://localhost:${port}`);
  console.log(`GraphiQL available at http://localhost:${port}/graphiql`);
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
