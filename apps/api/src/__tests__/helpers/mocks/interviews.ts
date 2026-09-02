/**
 * Test doubles for the interviews domain.
 *
 * One of the per-domain modules split out of the former 816-line
 * `helpers/mocks.ts` (JEF-254), which held all 68 factories together and was
 * imported by 157 test files.
 */

import { vi } from 'vitest';
import type { IInterviewRoundRepository } from '#src/use-cases/ports/IInterviewRoundRepository.js';
import type { InterviewRound } from '#src/domain/interviewRound/InterviewRound.js';

export const makeInterviewRoundRepository = (
  overrides?: Partial<IInterviewRoundRepository>,
): IInterviewRoundRepository => ({
  findAllByApplicationId: vi.fn(),
  countByApplicationId: vi.fn().mockResolvedValue(0),
  findAllByUserId: vi.fn().mockResolvedValue([]),
  findUpcomingWithinWindow: vi.fn().mockResolvedValue([]),
  findById: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  updatePushNotificationSentAt: vi.fn().mockResolvedValue(undefined),
  delete: vi.fn(),
  ...overrides,
});

export const makeInterviewRound = (overrides?: Partial<InterviewRound>): InterviewRound => ({
  id: 'round-1',
  applicationId: 'app-1',
  type: 'phone',
  scheduledAt: null,
  completedAt: null,
  interviewerName: null,
  notes: null,
  outcome: 'pending',
  pushNotificationSentAt: null,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  ...overrides,
});
