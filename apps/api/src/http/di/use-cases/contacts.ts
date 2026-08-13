import { asClass, Lifetime, type NameAndRegistrationPair } from 'awilix';

import { CreateContactUseCase } from '#src/use-cases/contacts/CreateContactUseCase.js';
import { GetContactsUseCase } from '#src/use-cases/contacts/GetContactsUseCase.js';
import { UpdateContactUseCase } from '#src/use-cases/contacts/UpdateContactUseCase.js';
import { DeleteContactUseCase } from '#src/use-cases/contacts/DeleteContactUseCase.js';

import type { Cradle } from '../types.js';

export const contacts = {
  createContactUseCase: asClass(CreateContactUseCase, { lifetime: Lifetime.TRANSIENT }),
  getContactsUseCase: asClass(GetContactsUseCase, { lifetime: Lifetime.TRANSIENT }),
  updateContactUseCase: asClass(UpdateContactUseCase, { lifetime: Lifetime.TRANSIENT }),
  deleteContactUseCase: asClass(DeleteContactUseCase, { lifetime: Lifetime.TRANSIENT }),
} satisfies NameAndRegistrationPair<Cradle>;
