import { asClass, Lifetime, type NameAndRegistrationPair } from 'awilix';

import { CreateMcpOAuthAccessTokenUseCase } from '#src/use-cases/mcpOAuth/CreateMcpOAuthAccessTokenUseCase.js';
import { RegisterMcpOAuthClientUseCase } from '#src/use-cases/mcpOAuth/RegisterMcpOAuthClientUseCase.js';
import { CreateMcpOAuthAuthorizationCodeUseCase } from '#src/use-cases/mcpOAuth/CreateMcpOAuthAuthorizationCodeUseCase.js';
import { ExchangeMcpOAuthAuthorizationCodeUseCase } from '#src/use-cases/mcpOAuth/ExchangeMcpOAuthAuthorizationCodeUseCase.js';
import { RevokeMcpOAuthGrantUseCase } from '#src/use-cases/mcpOAuth/RevokeMcpOAuthGrantUseCase.js';
import { CreateMcpOAuthRefreshTokenUseCase } from '#src/use-cases/mcpOAuth/CreateMcpOAuthRefreshTokenUseCase.js';
import { RotateMcpOAuthRefreshTokenUseCase } from '#src/use-cases/mcpOAuth/RotateMcpOAuthRefreshTokenUseCase.js';
import { ListMcpOAuthGrantsUseCase } from '#src/use-cases/mcpOAuth/ListMcpOAuthGrantsUseCase.js';
import { RevokeMcpOAuthGrantForUserUseCase } from '#src/use-cases/mcpOAuth/RevokeMcpOAuthGrantForUserUseCase.js';

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
  revokeMcpOAuthGrantUseCase: asClass(RevokeMcpOAuthGrantUseCase, {
    lifetime: Lifetime.TRANSIENT,
  }),
  createMcpOAuthRefreshTokenUseCase: asClass(CreateMcpOAuthRefreshTokenUseCase, {
    lifetime: Lifetime.TRANSIENT,
  }),
  rotateMcpOAuthRefreshTokenUseCase: asClass(RotateMcpOAuthRefreshTokenUseCase, {
    lifetime: Lifetime.TRANSIENT,
  }),
  listMcpOAuthGrantsUseCase: asClass(ListMcpOAuthGrantsUseCase, {
    lifetime: Lifetime.TRANSIENT,
  }),
  revokeMcpOAuthGrantForUserUseCase: asClass(RevokeMcpOAuthGrantForUserUseCase, {
    lifetime: Lifetime.TRANSIENT,
  }),
} satisfies NameAndRegistrationPair<Cradle>;
