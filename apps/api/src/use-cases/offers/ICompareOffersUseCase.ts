import type { Offer } from '#src/domain/offer/Offer.js';

export interface OfferComparison {
  offer: Offer;
  company: string;
  role: string;
  normalizedYearlySalary: number;
  totalCompensation: number;
}

export interface CompareOffersInput {
  userId: string;
  offerIds: string[];
}

export interface ICompareOffersUseCase {
  execute(input: CompareOffersInput): Promise<OfferComparison[]>;
}
