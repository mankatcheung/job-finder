export interface DeleteOfferInput {
  userId: string;
  offerId: string;
}

export interface IDeleteOfferUseCase {
  execute(input: DeleteOfferInput): Promise<void>;
}
