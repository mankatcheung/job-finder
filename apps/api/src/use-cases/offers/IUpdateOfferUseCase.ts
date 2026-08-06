import type { Offer } from '#src/domain/offer/Offer.js';

export interface UpdateOfferInput {
  userId: string;
  offerId: string;
  baseSalary?: number;
  bonus?: number | null;
  equity?: string | null;
  benefits?: string | null;
  costOfLivingAdjustment?: number | null;
  currency?: string;
  period?: string;
  notes?: string | null;
}

export interface IUpdateOfferUseCase {
  execute(input: UpdateOfferInput): Promise<Offer>;
}
