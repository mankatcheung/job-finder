import { asClass, Lifetime, type NameAndRegistrationPair } from 'awilix';

import { CreateMcpOAuthAccessTokenUseCase } from '#src/use-cases/mcpOAuth/CreateMcpOAuthAccessTokenUseCase.js';
import { RegisterMcpOAuthClientUseCase } from '#src/use-cases/mcpOAuth/RegisterMcpOAuthClientUseCase.js';
import { CreateMcpOAuthAuthorizationCodeUseCase } from '#src/use-cases/mcpOAuth/CreateMcpOAuthAuthorizationCodeUseCase.js';
import { ExchangeMcpOAuthAuthorizationCodeUseCase } from '#src/use-cases/mcpOAuth/ExchangeMcpOAuthAuthorizationCodeUseCase.js';
import { RevokeMcpOAuthAccessTokenUseCase } from '#src/use-cases/mcpOAuth/RevokeMcpOAuthAccessTokenUseCase.js';

import type { Cradle } from '../types.js';

export const mcpOAuth = {
  createMcpOAuthAccessTokenUseCase: asClass(CreateMcpOAuthAccessTokenUseCase, {
    lifetime: Lifetime.TRANSIENT,
  }),
  registerMcpOAuthClientUseCase: asClass(RegisterMcpOAuthClientUseCase, {
    lifetime: Lifetime.TRANSIENT,
  }),
  createMcpOAuthAuthorizationCodeUseCase: asClass(CreateMcpOAuthAuthorizationCodeUseCase, {
    lifetime: Lifetime.TRANSIENT,
  }),
  exchangeMcpOAuthAuthorizationCodeUseCase: asClass(ExchangeMcpOAuthAuthorizationCodeUseCase, {
    lifetime: Lifetime.TRANSIENT,
  }),
  revokeMcpOAuthAccessTokenUseCase: asClass(RevokeMcpOAuthAccessTokenUseCase, {
    lifetime: Lifetime.TRANSIENT,
  }),
} satisfies NameAndRegistrationPair<Cradle>;
