import type { IOfferRepository } from '#src/use-cases/ports/IOfferRepository.js';
import type { IApplicationRepository } from '#src/use-cases/ports/IApplicationRepository.js';
import { NotFoundError, ForbiddenError } from '#src/http/errors/AppError.js';
import type { IDeleteOfferUseCase, DeleteOfferInput } from './IDeleteOfferUseCase.js';

export class DeleteOfferUseCase implements IDeleteOfferUseCase {
  constructor(
    private readonly offerRepository: IOfferRepository,
    private readonly applicationRepository: IApplicationRepository,
  ) {}

  async execute(input: DeleteOfferInput): Promise<void> {
    const offer = await this.offerRepository.findById(input.offerId);
    if (!offer) {
      throw new NotFoundError('Offer not found');
    }

    const app = await this.applicationRepository.findById(offer.applicationId);
    if (!app || app.userId !== input.userId) {
      throw new ForbiddenError('Not authorized');
    }

    await this.offerRepository.delete(input.offerId);
  }
}
