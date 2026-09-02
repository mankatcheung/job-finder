/**
 * Test doubles for the apiTokens domain.
 *
 * One of the per-domain modules split out of the former 816-line
 * `helpers/mocks.ts` (JEF-254), which held all 68 factories together and was
 * imported by 157 test files.
 */

import { vi } from 'vitest';
import type { ApiToken } from '#src/domain/apiToken/ApiToken.js';
import type { IApiTokenRepository } from '#src/use-cases/ports/IApiTokenRepository.js';

export const makeApiTokenRepository = (
  overrides?: Partial<IApiTokenRepository>,
): IApiTokenRepository => ({
  findAllByUserId: vi.fn().mockResolvedValue([]),
  findById: vi.fn().mockResolvedValue(null),
  findByTokenHash: vi.fn().mockResolvedValue(null),
  findByIdAndUserId: vi.fn().mockResolvedValue(null),
  create: vi.fn(),
  updateLastUsed: vi.fn(),
  delete: vi.fn(),
  ...overrides,
});

export const makeApiToken = (overrides?: Partial<ApiToken>): ApiToken => ({
  id: 'token-1',
  userId: 'user-1',
  name: 'My CLI token',
  tokenHash: 'hashed-value',
  scope: 'full',
  lastUsedAt: null,
  createdAt: new Date('2024-01-01'),
  ...overrides,
});
