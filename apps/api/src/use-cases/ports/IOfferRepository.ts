import type { Offer } from '#src/domain/offer/Offer.js';

export interface CreateOfferData {
  id: string;
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

export interface UpdateOfferData {
  baseSalary?: number;
  bonus?: number | null;
  equity?: string | null;
  benefits?: string | null;
  costOfLivingAdjustment?: number | null;
  currency?: string;
  period?: string;
  notes?: string | null;
}

export interface IOfferRepository {
  findAllByApplicationId(applicationId: string): Promise<Offer[]>;
  findById(id: string): Promise<Offer | null>;
  create(data: CreateOfferData): Promise<Offer>;
  update(id: string, data: UpdateOfferData): Promise<Offer>;
  delete(id: string): Promise<void>;
}
