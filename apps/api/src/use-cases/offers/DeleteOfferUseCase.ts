import type { IOfferRepository } from '#src/use-cases/ports/IOfferRepository.js';
import type { IApplicationRepository } from '#src/use-cases/ports/IApplicationRepository.js';
import { NotFoundError, ForbiddenError } from '#src/use-cases/errors/DomainError.js';
import type { IDeleteOfferUseCase, DeleteOfferInput } from './IDeleteOfferUseCase.js';

interface Deps {
  offerRepository: IOfferRepository;
  applicationRepository: IApplicationRepository;
}

export class DeleteOfferUseCase implements IDeleteOfferUseCase {
  constructor(private readonly deps: Deps) {}

  async execute(input: DeleteOfferInput): Promise<void> {
    const offer = await this.deps.offerRepository.findById(input.offerId);
    if (!offer) {
      throw new NotFoundError('Offer not found');
    }

    const app = await this.deps.applicationRepository.findById(offer.applicationId);
    if (!app || app.userId !== input.userId) {
      throw new ForbiddenError('Not authorized');
    }

    await this.deps.offerRepository.delete(input.offerId);
  }
}
