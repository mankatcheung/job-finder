import fp from 'fastify-plugin';
import jwt from '@fastify/jwt';
import type { FastifyInstance } from 'fastify';
import { ENV } from '@/constants.js';

export default fp(async function authPlugin(fastify: FastifyInstance) {
  await fastify.register(jwt, {
    secret: process.env[ENV.JWT_SECRET]!,
  });
});
