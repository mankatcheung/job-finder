import { asClass, Lifetime, type NameAndRegistrationPair } from 'awilix';

import { CreateSessionUseCase } from '#src/use-cases/sessions/CreateSessionUseCase.js';
import { RotateRefreshTokenUseCase } from '#src/use-cases/sessions/RotateRefreshTokenUseCase.js';
import { ListSessionsUseCase } from '#src/use-cases/sessions/ListSessionsUseCase.js';
import { RevokeSessionUseCase } from '#src/use-cases/sessions/RevokeSessionUseCase.js';
import { RevokeOtherSessionsUseCase } from '#src/use-cases/sessions/RevokeOtherSessionsUseCase.js';

import type { Cradle } from '../types.js';

export const sessions = {
  createSessionUseCase: asClass(CreateSessionUseCase, { lifetime: Lifetime.TRANSIENT }),
  rotateRefreshTokenUseCase: asClass(RotateRefreshTokenUseCase, {
    lifetime: Lifetime.TRANSIENT,
  }),
  listSessionsUseCase: asClass(ListSessionsUseCase, { lifetime: Lifetime.TRANSIENT }),
  revokeSessionUseCase: asClass(RevokeSessionUseCase, { lifetime: Lifetime.TRANSIENT }),
  revokeOtherSessionsUseCase: asClass(RevokeOtherSessionsUseCase, {
    lifetime: Lifetime.TRANSIENT,
  }),
} satisfies NameAndRegistrationPair<Cradle>;
