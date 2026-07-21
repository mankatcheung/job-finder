import { buildApp } from '@/app.js';
import { ENV } from '@/constants.js';

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
