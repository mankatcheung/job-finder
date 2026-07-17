import fp from 'fastify-plugin';
import jwt from '@fastify/jwt';
import type { FastifyInstance } from 'fastify';

export default fp(async function authPlugin(fastify: FastifyInstance) {
  fastify.register(jwt, {
    secret: process.env.JWT_SECRET!,
  });
});
