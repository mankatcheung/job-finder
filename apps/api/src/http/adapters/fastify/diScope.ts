import type { FastifyRequest } from 'fastify';
import type { AwilixContainer } from 'awilix';
import type { Cradle } from '@/http/container.js';

/**
 * `@fastify/awilix` types `request.diScope` against its own (unaugmented)
 * `Cradle` interface — this app's actual `Cradle` shape (container.ts) is
 * assembled independent of that package, so the request-scoped container is
 * re-cast here rather than via declaration merging.
 */
export function diScopeOf(request: FastifyRequest): AwilixContainer<Cradle> {
  return request.diScope as unknown as AwilixContainer<Cradle>;
}
