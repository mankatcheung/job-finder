import type { FastifyInstance } from 'fastify';
import type { RouteDefinition } from '@/http/ports/RouteDefinition.js';
import { toHttpRequest } from '@/http/adapters/fastify/toHttpRequest.js';
import { toHttpResponse } from '@/http/adapters/fastify/toHttpResponse.js';

export function registerRoutes(fastify: FastifyInstance, routes: RouteDefinition[]): void {
  for (const route of routes) {
    fastify.route({
      method: route.method,
      url: route.path,
      handler: async (request, reply) => {
        await route.handler(toHttpRequest(request), toHttpResponse(reply));
      },
    });
  }
}
