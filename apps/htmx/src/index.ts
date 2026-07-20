import { buildServer } from './server.js';

const PORT = parseInt(process.env['PORT'] ?? '3002', 10);

const server = await buildServer();
await server.listen({ port: PORT, host: '0.0.0.0' });
console.log(`HTMX app listening on http://localhost:${PORT}`);
