import type { CompanyBriefing } from '#src/domain/companyBriefing/CompanyBriefing.js';
import type { IApplicationRepository } from '#src/use-cases/ports/IApplicationRepository.js';
import type { ICompanyBriefingRepository } from '#src/use-cases/ports/ICompanyBriefingRepository.js';
import { ForbiddenError, NotFoundError } from '#src/use-cases/errors/DomainError.js';

export interface GetCompanyBriefingInput {
  userId: string;
  applicationId: string;
}

export interface IGetCompanyBriefingUseCase {
  execute(input: GetCompanyBriefingInput): Promise<CompanyBriefing | null>;
}

interface Deps {
  applicationRepository: IApplicationRepository;
  companyBriefingRepository: ICompanyBriefingRepository;
}

/**
 * Reads the stored briefing, or null when one has never been generated.
 *
 * Null is not an error: "no briefing yet" is the normal opening state of the
 * tab, and making the caller distinguish that from a real failure would push
 * the decision to every client.
 */
export class GetCompanyBriefingUseCase implements IGetCompanyBriefingUseCase {
  constructor(private readonly deps: Deps) {}

  async execute(input: GetCompanyBriefingInput): Promise<CompanyBriefing | null> {
    // Goes through the trash-filtered findById, so a trashed application
    // reports as missing rather than serving its briefing.
    const app = await this.deps.applicationRepository.findById(input.applicationId);
    if (!app) {
      throw new NotFoundError('Application not found');
    }
    if (app.userId !== input.userId) {
      throw new ForbiddenError('Forbidden');
    }

    return this.deps.companyBriefingRepository.findByApplicationId(input.applicationId);
  }
}
