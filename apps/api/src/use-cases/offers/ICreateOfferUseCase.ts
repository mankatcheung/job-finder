import type { Offer } from '#src/domain/offer/Offer.js';

export interface CreateOfferInput {
  userId: string;
  applicationId: string;
  baseSalary: number;
  bonus?: number | null;
  equity?: string | null;
  benefits?: string | null;
  costOfLivingAdjustment?: number | null;
  currency?: string;
  period?: string;
  notes?: string | null;
}

export interface ICreateOfferUseCase {
  execute(input: CreateOfferInput): Promise<Offer>;
}
