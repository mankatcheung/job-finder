import type { Offer } from '#src/domain/offer/Offer.js';
import type { IOfferRepository } from '#src/use-cases/ports/IOfferRepository.js';
import type { IApplicationRepository } from '#src/use-cases/ports/IApplicationRepository.js';
import { NotFoundError, ForbiddenError } from '#src/use-cases/errors/DomainError.js';
import type { IUpdateOfferUseCase, UpdateOfferInput } from './IUpdateOfferUseCase.js';

interface Deps {
  offerRepository: IOfferRepository;
  applicationRepository: IApplicationRepository;
}

export class UpdateOfferUseCase implements IUpdateOfferUseCase {
  constructor(private readonly deps: Deps) {}

  async execute(input: UpdateOfferInput): Promise<Offer> {
    const offer = await this.deps.offerRepository.findById(input.offerId);
    if (!offer) {
      throw new NotFoundError('Offer not found');
    }

    const app = await this.deps.applicationRepository.findById(offer.applicationId);
    if (!app || app.userId !== input.userId) {
      throw new ForbiddenError('Not authorized');
    }

    return this.deps.offerRepository.update(input.offerId, {
      baseSalary: input.baseSalary,
      bonus: input.bonus,
      equity: input.equity,
      benefits: input.benefits,
      costOfLivingAdjustment: input.costOfLivingAdjustment,
      currency: input.currency,
      period: input.period,
      notes: input.notes,
    });
  }
}
