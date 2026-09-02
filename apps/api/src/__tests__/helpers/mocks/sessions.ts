/**
 * Test doubles for the sessions domain.
 *
 * One of the per-domain modules split out of the former 816-line
 * `helpers/mocks.ts` (JEF-254), which held all 68 factories together and was
 * imported by 157 test files.
 */

import { vi } from 'vitest';
import type { ISessionRepository } from '#src/use-cases/ports/ISessionRepository.js';
import type { Session } from '#src/domain/session/Session.js';

export const makeSessionRepository = (
  overrides?: Partial<ISessionRepository>,
): ISessionRepository => ({
  create: vi.fn(),
  findById: vi.fn().mockResolvedValue(null),
  findByIdAndUserId: vi.fn().mockResolvedValue(null),
  findActiveByUserId: vi.fn().mockResolvedValue([]),
  touch: vi.fn().mockResolvedValue(undefined),
  rotateRefreshToken: vi.fn().mockResolvedValue(undefined),
  revoke: vi.fn().mockResolvedValue(undefined),
  revokeAllForUserExcept: vi.fn().mockResolvedValue(undefined),
  revokeAllForUser: vi.fn().mockResolvedValue(undefined),
  findDistinctUserAgentsByUserId: vi.fn().mockResolvedValue([]),
  ...overrides,
});

export const makeSession = (overrides?: Partial<Session>): Session => ({
  id: 'session-1',
  userId: 'user-1',
  userAgent: 'Mozilla/5.0 (test)',
  ipAddress: '127.0.0.1',
  deviceLabel: null,
  location: null,
  lastUsedAt: new Date('2024-01-01T00:00:00.000Z'),
  createdAt: new Date('2024-01-01T00:00:00.000Z'),
  expiresAt: new Date('2024-01-08T00:00:00.000Z'),
  revokedAt: null,
  currentRefreshTokenId: 'refresh-token-id-1',
  previousRefreshTokenId: null,
  previousRotatedAt: null,
  ...overrides,
});
