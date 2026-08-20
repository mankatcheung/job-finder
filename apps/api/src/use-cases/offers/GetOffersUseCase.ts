import type { Offer } from '#src/domain/offer/Offer.js';
import type { IOfferRepository } from '#src/use-cases/ports/IOfferRepository.js';
import type { IApplicationRepository } from '#src/use-cases/ports/IApplicationRepository.js';
import { NotFoundError } from '#src/use-cases/errors/DomainError.js';
import type { IGetOffersUseCase, GetOffersInput } from './IGetOffersUseCase.js';

interface Deps {
  offerRepository: IOfferRepository;
  applicationRepository: IApplicationRepository;
}

export class GetOffersUseCase implements IGetOffersUseCase {
  constructor(private readonly deps: Deps) {}

  async execute(input: GetOffersInput): Promise<Offer[]> {
    const app = await this.deps.applicationRepository.findById(input.applicationId);
    if (!app || app.userId !== input.userId) {
      throw new NotFoundError('Application not found');
    }

    return this.deps.offerRepository.findAllByApplicationId(input.applicationId);
  }
}
