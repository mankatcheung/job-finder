import { asClass, Lifetime, type NameAndRegistrationPair } from 'awilix';

import { CreateMcpOAuthAccessTokenUseCase } from '#src/use-cases/mcpOAuth/CreateMcpOAuthAccessTokenUseCase.js';

import type { Cradle } from '../types.js';

export const mcpOAuth = {
  createMcpOAuthAccessTokenUseCase: asClass(CreateMcpOAuthAccessTokenUseCase, {
    lifetime: Lifetime.TRANSIENT,
  }),
} satisfies NameAndRegistrationPair<Cradle>;
