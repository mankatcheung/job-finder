/**
 * Test doubles for the shareLinks domain.
 *
 * One of the per-domain modules split out of the former 816-line
 * `helpers/mocks.ts` (JEF-254), which held all 68 factories together and was
 * imported by 157 test files.
 */

import { vi } from 'vitest';
import type { IShareLinkRepository } from '#src/use-cases/ports/IShareLinkRepository.js';
import type { ShareLink } from '#src/domain/shareLink/ShareLink.js';

export const makeShareLinkRepository = (
  overrides?: Partial<IShareLinkRepository>,
): IShareLinkRepository => ({
  findAllByUserId: vi.fn().mockResolvedValue([]),
  findByTokenHash: vi.fn().mockResolvedValue(null),
  findByIdAndUserId: vi.fn().mockResolvedValue(null),
  create: vi.fn(),
  updateLastUsed: vi.fn(),
  delete: vi.fn(),
  ...overrides,
});

export const makeShareLink = (overrides?: Partial<ShareLink>): ShareLink => ({
  id: 'share-link-1',
  userId: 'user-1',
  name: 'For my mentor',
  tokenHash: 'hashed-value',
  lastUsedAt: null,
  createdAt: new Date('2024-01-01'),
  ...overrides,
});
