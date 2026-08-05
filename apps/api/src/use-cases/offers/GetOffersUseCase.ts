import type { Offer } from '#src/domain/offer/Offer.js';
import type { IOfferRepository } from '#src/use-cases/ports/IOfferRepository.js';
import type { IApplicationRepository } from '#src/use-cases/ports/IApplicationRepository.js';
import { NotFoundError } from '#src/http/errors/AppError.js';
import type { IGetOffersUseCase, GetOffersInput } from './IGetOffersUseCase.js';

export class GetOffersUseCase implements IGetOffersUseCase {
  constructor(
    private readonly offerRepository: IOfferRepository,
    private readonly applicationRepository: IApplicationRepository,
  ) {}

  async execute(input: GetOffersInput): Promise<Offer[]> {
    const app = await this.applicationRepository.findById(input.applicationId);
    if (!app || app.userId !== input.userId) {
      throw new NotFoundError('Application not found');
    }

    return this.offerRepository.findAllByApplicationId(input.applicationId);
  }
}
