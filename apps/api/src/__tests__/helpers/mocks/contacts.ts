/**
 * Test doubles for the contacts domain.
 *
 * One of the per-domain modules split out of the former 816-line
 * `helpers/mocks.ts` (JEF-254), which held all 68 factories together and was
 * imported by 157 test files.
 */

import { vi } from 'vitest';
import type { Contact } from '#src/domain/contact/Contact.js';
import type { IContactRepository } from '#src/use-cases/ports/IContactRepository.js';

export const makeContactRepository = (
  overrides?: Partial<IContactRepository>,
): IContactRepository => ({
  findAllByApplicationId: vi.fn().mockResolvedValue([]),
  countByApplicationId: vi.fn().mockResolvedValue(0),
  findById: vi.fn().mockResolvedValue(null),
  create: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  ...overrides,
});

export const makeContact = (overrides?: Partial<Contact>): Contact => ({
  id: 'contact-1',
  applicationId: 'app-1',
  name: 'Jane Recruiter',
  role: 'Technical Recruiter',
  email: 'jane@example.com',
  phone: null,
  linkedinUrl: null,
  notes: null,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  ...overrides,
});
