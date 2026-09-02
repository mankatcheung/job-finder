/**
 * Test doubles for the cookieConsent domain.
 *
 * One of the per-domain modules split out of the former 816-line
 * `helpers/mocks.ts` (JEF-254), which held all 68 factories together and was
 * imported by 157 test files.
 */

import { vi } from 'vitest';
import type { ICookieConsentRepository } from '#src/use-cases/ports/ICookieConsentRepository.js';

export const makeCookieConsentRepository = (
  overrides?: Partial<ICookieConsentRepository>,
): ICookieConsentRepository => ({
  create: vi.fn(),
  ...overrides,
});
