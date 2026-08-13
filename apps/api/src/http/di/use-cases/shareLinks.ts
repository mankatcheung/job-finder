import { asClass, Lifetime, type NameAndRegistrationPair } from 'awilix';

import { CreateShareLinkUseCase } from '#src/use-cases/shareLinks/CreateShareLinkUseCase.js';
import { ListShareLinksUseCase } from '#src/use-cases/shareLinks/ListShareLinksUseCase.js';
import { DeleteShareLinkUseCase } from '#src/use-cases/shareLinks/DeleteShareLinkUseCase.js';
import { GetSharedSummaryUseCase } from '#src/use-cases/shareLinks/GetSharedSummaryUseCase.js';

import type { Cradle } from '../types.js';

export const shareLinks = {
  createShareLinkUseCase: asClass(CreateShareLinkUseCase, { lifetime: Lifetime.TRANSIENT }),
  listShareLinksUseCase: asClass(ListShareLinksUseCase, { lifetime: Lifetime.TRANSIENT }),
  deleteShareLinkUseCase: asClass(DeleteShareLinkUseCase, { lifetime: Lifetime.TRANSIENT }),
  getSharedSummaryUseCase: asClass(GetSharedSummaryUseCase, { lifetime: Lifetime.TRANSIENT }),
} satisfies NameAndRegistrationPair<Cradle>;
