import type { Offer } from '#src/domain/offer/Offer.js';
import type { IOfferRepository } from '#src/use-cases/ports/IOfferRepository.js';
import type { IApplicationRepository } from '#src/use-cases/ports/IApplicationRepository.js';
import { NotFoundError } from '#src/http/errors/AppError.js';
import type { ICreateOfferUseCase, CreateOfferInput } from './ICreateOfferUseCase.js';

export class CreateOfferUseCase implements ICreateOfferUseCase {
  constructor(
    private readonly offerRepository: IOfferRepository,
    private readonly applicationRepository: IApplicationRepository,
  ) {}

  async execute(input: CreateOfferInput): Promise<Offer> {
    const app = await this.applicationRepository.findById(input.applicationId);
    if (!app || app.userId !== input.userId) {
      throw new NotFoundError('Application not found');
    }

    const id = crypto.randomUUID();
    return this.offerRepository.create({
      id,
      applicationId: input.applicationId,
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
