import { ForbiddenError, NotFoundError } from '#src/use-cases/errors/DomainError.js';
import type { IApplicationRepository } from '#src/use-cases/ports/IApplicationRepository.js';
import type { IContactRepository } from '#src/use-cases/ports/IContactRepository.js';
import type {
  IGetContactsUseCase,
  GetContactsInput,
  GetContactsOutput,
} from '#src/use-cases/contacts/IGetContactsUseCase.js';

interface Deps {
  applicationRepository: IApplicationRepository;
  contactRepository: IContactRepository;
}

export class GetContactsUseCase implements IGetContactsUseCase {
  constructor(private readonly deps: Deps) {}

  async execute(input: GetContactsInput): Promise<GetContactsOutput> {
    const app = await this.deps.applicationRepository.findById(input.applicationId);
    if (!app) throw new NotFoundError('Application not found');
    if (app.userId !== input.userId) throw new ForbiddenError('Forbidden');

    return this.deps.contactRepository.findAllByApplicationId(input.applicationId);
  }
}
