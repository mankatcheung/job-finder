import { asClass, Lifetime, type NameAndRegistrationPair } from 'awilix';

import { CreateNoteUseCase } from '#src/use-cases/notes/CreateNoteUseCase.js';
import { GetNotesUseCase } from '#src/use-cases/notes/GetNotesUseCase.js';
import { UpdateNoteUseCase } from '#src/use-cases/notes/UpdateNoteUseCase.js';
import { DeleteNoteUseCase } from '#src/use-cases/notes/DeleteNoteUseCase.js';

import type { Cradle } from '../types.js';

export const notes = {
  createNoteUseCase: asClass(CreateNoteUseCase, { lifetime: Lifetime.TRANSIENT }),
  getNotesUseCase: asClass(GetNotesUseCase, { lifetime: Lifetime.TRANSIENT }),
  updateNoteUseCase: asClass(UpdateNoteUseCase, { lifetime: Lifetime.TRANSIENT }),
  deleteNoteUseCase: asClass(DeleteNoteUseCase, { lifetime: Lifetime.TRANSIENT }),
} satisfies NameAndRegistrationPair<Cradle>;
