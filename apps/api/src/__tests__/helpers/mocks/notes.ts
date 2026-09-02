/**
 * Test doubles for the notes domain.
 *
 * One of the per-domain modules split out of the former 816-line
 * `helpers/mocks.ts` (JEF-254), which held all 68 factories together and was
 * imported by 157 test files.
 */

import { vi } from 'vitest';
import type { INoteRepository } from '#src/use-cases/ports/INoteRepository.js';
import type { Note } from '#src/domain/note/Note.js';

export const makeNoteRepository = (overrides?: Partial<INoteRepository>): INoteRepository => ({
  // Defaults to an empty list, like the other list finders — a bare vi.fn()
  // resolves undefined, which every caller then has to guard against.
  findAllByApplicationId: vi.fn().mockResolvedValue([]),
  countByApplicationId: vi.fn().mockResolvedValue(0),
  findById: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  findRecentByUserExcludingApplication: vi.fn().mockResolvedValue([]),
  ...overrides,
});

export const makeNote = (overrides?: Partial<Note>): Note => ({
  id: 'note-1',
  applicationId: 'app-1',
  content: 'Interviewed well, follow up next week.',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  ...overrides,
});
