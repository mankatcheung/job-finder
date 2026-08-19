import fp from 'fastify-plugin';
import cors from '@fastify/cors';
import type { FastifyInstance } from 'fastify';
import { ENV } from '#src/constants.js';

export default fp(async function corsPlugin(fastify: FastifyInstance) {
  const allowedOrigins = process.env[ENV.CORS_ORIGIN]
    ?.split(',')
    .map((origin) => origin.trim()) ?? ['http://localhost:3000'];
  await fastify.register(cors, {
    origin: (origin, cb) => {
      if (!origin) return cb(null, true);
      // Allow browser extension requests
      if (origin.startsWith('chrome-extension://')) return cb(null, true);
      // Allow explicit origins from CORS_ORIGIN env var (comma-separated)
      if (allowedOrigins.includes(origin)) return cb(null, true);
      // Allow Vercel preview deployments (*.vercel.app)
      if (origin.endsWith('.vercel.app')) return cb(null, true);
      // Refused, not failed. Handing an Error to this callback makes
      // @fastify/cors throw, which surfaces as a 500 — so a routine
      // cross-origin request from an origin we simply do not list looked
      // like the API falling over, and burned a server error in the logs
      // and metrics every time. Answering `false` omits the
      // Access-Control-Allow-Origin header instead, which is what actually
      // enforces CORS: the browser blocks the response. The request is
      // still refused; it is now refused correctly.
      cb(null, false);
    },
    credentials: true,
  });
});
