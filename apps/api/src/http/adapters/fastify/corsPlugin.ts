import fp from 'fastify-plugin';
import cors from '@fastify/cors';
import type { FastifyInstance } from 'fastify';
import { ENV } from '#src/constants.js';

export default fp(async function corsPlugin(fastify: FastifyInstance) {
  const allowedOrigins = process.env[ENV.CORS_ORIGIN]?.split(',') ?? ['http://localhost:3000'];
  await fastify.register(cors, {
    origin: (origin, cb) => {
      if (!origin) return cb(null, true);
      // Allow browser extension requests
      if (origin.startsWith('chrome-extension://')) return cb(null, true);
      // Allow explicit origins from CORS_ORIGIN env var (comma-separated)
      if (allowedOrigins.includes(origin)) return cb(null, true);
      // Allow Vercel preview deployments (*.vercel.app)
      if (origin.endsWith('.vercel.app')) return cb(null, true);
      cb(new Error('Not allowed by CORS'), false);
    },
    credentials: true,
  });
});
