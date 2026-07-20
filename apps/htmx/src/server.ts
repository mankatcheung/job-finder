import Fastify from 'fastify';
import cookie from '@fastify/cookie';
import formbody from '@fastify/formbody';
import staticFiles from '@fastify/static';
import { fileURLToPath } from 'node:url';
import { join, dirname } from 'node:path';

import authRoutes from './routes/auth.js';
import dashboardRoutes from './routes/dashboard.js';
import applicationListRoutes from './routes/applications/list.js';
import applicationFormRoutes from './routes/applications/form.js';
import applicationDetailRoutes from './routes/applications/detail.js';
import notesRoutes from './routes/applications/notes.js';
import contactsRoutes from './routes/applications/contacts.js';
import interviewsRoutes from './routes/applications/interviews.js';
import boardRoutes from './routes/applications/board.js';
import analyticsRoutes from './routes/analytics.js';
import accountRoutes from './routes/account.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

export async function buildServer() {
  const fastify = Fastify({ logger: { level: 'info' } });

  await fastify.register(cookie);
  await fastify.register(formbody);

  // Serve static files from public/ if it exists
  const publicDir = join(__dirname, '..', 'public');
  await fastify.register(staticFiles, { root: publicDir, prefix: '/public/', decorateReply: false });

  // Redirect root to dashboard
  fastify.get('/', async (_req, reply) => reply.redirect('/dashboard'));

  await fastify.register(authRoutes);
  await fastify.register(dashboardRoutes);
  await fastify.register(applicationListRoutes);
  await fastify.register(applicationFormRoutes);
  await fastify.register(applicationDetailRoutes);
  await fastify.register(notesRoutes);
  await fastify.register(contactsRoutes);
  await fastify.register(interviewsRoutes);
  await fastify.register(boardRoutes);
  await fastify.register(analyticsRoutes);
  await fastify.register(accountRoutes);

  return fastify;
}
