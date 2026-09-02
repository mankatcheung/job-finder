/**
 * Test doubles for the activity domain.
 *
 * One of the per-domain modules split out of the former 816-line
 * `helpers/mocks.ts` (JEF-254), which held all 68 factories together and was
 * imported by 157 test files.
 */

import { vi } from 'vitest';
import type { IActivityLogRepository } from '#src/use-cases/ports/IActivityLogRepository.js';

export const makeActivityLogRepository = (
  overrides?: Partial<IActivityLogRepository>,
): IActivityLogRepository => ({
  findAllByApplicationId: vi.fn().mockResolvedValue([]),
  findAllByUserId: vi.fn().mockResolvedValue([]),
  append: vi.fn(),
  ...overrides,
});
