import { createContainer, type AwilixContainer } from 'awilix';

import { infrastructure } from './infrastructure.js';
import { repositories } from './repositories.js';
import { rateLimiters } from './rate-limiters.js';
import { mappers } from './mappers.js';
import { resolvers } from './resolvers.js';
import { useCases } from './use-cases/index.js';

import type { Cradle } from './types.js';

export function buildContainer(): AwilixContainer<Cradle> {
  const container = createContainer<Cradle>();
  container.register({
    ...infrastructure,
    ...repositories,
    ...rateLimiters,
    ...mappers,
    ...resolvers,
    ...useCases,
  });
  return container;
}
