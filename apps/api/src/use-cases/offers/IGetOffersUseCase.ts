import type { Offer } from '#src/domain/offer/Offer.js';

export interface GetOffersInput {
  userId: string;
  applicationId: string;
}

export interface IGetOffersUseCase {
  execute(input: GetOffersInput): Promise<Offer[]>;
}
