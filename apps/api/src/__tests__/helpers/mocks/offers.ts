/**
 * Test doubles for the offers domain.
 *
 * One of the per-domain modules split out of the former 816-line
 * `helpers/mocks.ts` (JEF-254), which held all 68 factories together and was
 * imported by 157 test files.
 */

import { vi } from 'vitest';
import type { IOfferRepository } from '#src/use-cases/ports/IOfferRepository.js';
import type { Offer } from '#src/domain/offer/Offer.js';

export const makeOfferRepository = (overrides?: Partial<IOfferRepository>): IOfferRepository => ({
  findAllByApplicationId: vi.fn().mockResolvedValue([]),
  countByApplicationId: vi.fn().mockResolvedValue(0),
  findAllByUserId: vi.fn().mockResolvedValue([]),
  findById: vi.fn().mockResolvedValue(null),
  create: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  ...overrides,
});

export const makeOffer = (overrides?: Partial<Offer>): Offer => ({
  id: 'offer-1',
  applicationId: 'app-1',
  baseSalary: 120_000,
  bonus: null,
  equity: null,
  benefits: null,
  costOfLivingAdjustment: null,
  currency: 'USD',
  period: 'yearly',
  notes: null,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  ...overrides,
});
