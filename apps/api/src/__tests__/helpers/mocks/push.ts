/**
 * Test doubles for the push domain.
 *
 * One of the per-domain modules split out of the former 816-line
 * `helpers/mocks.ts` (JEF-254), which held all 68 factories together and was
 * imported by 157 test files.
 */

import { vi } from 'vitest';
import type { IPushSubscriptionRepository } from '#src/use-cases/ports/IPushSubscriptionRepository.js';
import type { PushSubscription } from '#src/domain/pushSubscription/PushSubscription.js';

export const makePushSubscriptionRepository = (
  overrides?: Partial<IPushSubscriptionRepository>,
): IPushSubscriptionRepository => ({
  findByUserId: vi.fn().mockResolvedValue([]),
  findByEndpoint: vi.fn().mockResolvedValue(null),
  upsert: vi.fn(),
  deleteByEndpoint: vi.fn().mockResolvedValue(undefined),
  deleteByUserId: vi.fn().mockResolvedValue(undefined),
  ...overrides,
});

export const makePushSubscription = (overrides?: Partial<PushSubscription>): PushSubscription => ({
  id: 'push-sub-1',
  userId: 'user-1',
  provider: 'web',
  endpoint: 'https://push.example.com/sub-1',
  p256dh: 'p256dh-key',
  auth: 'auth-key',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  ...overrides,
});
