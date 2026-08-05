import type { Offer } from '#src/domain/offer/Offer.js';

export interface OfferDTO {
  id: string;
  applicationId: string;
  baseSalary: number;
  bonus: number | null;
  equity: string | null;
  benefits: string | null;
  costOfLivingAdjustment: number | null;
  currency: string;
  period: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export class OfferMapper {
  toDTO(offer: Offer): OfferDTO {
    return {
      id: offer.id,
      applicationId: offer.applicationId,
      baseSalary: offer.baseSalary,
      bonus: offer.bonus,
      equity: offer.equity,
      benefits: offer.benefits,
      costOfLivingAdjustment: offer.costOfLivingAdjustment,
      currency: offer.currency,
      period: offer.period,
      notes: offer.notes,
      createdAt: offer.createdAt.toISOString(),
      updatedAt: offer.updatedAt.toISOString(),
    };
  }
}
