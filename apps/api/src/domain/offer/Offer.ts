export type OfferPeriod = 'yearly' | 'monthly' | 'weekly' | 'hourly';

export interface Offer {
  id: string;
  applicationId: string;
  baseSalary: number;
  bonus: number | null;
  equity: string | null;
  benefits: string | null;
  costOfLivingAdjustment: number | null;
  currency: string;
  period: OfferPeriod;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}
