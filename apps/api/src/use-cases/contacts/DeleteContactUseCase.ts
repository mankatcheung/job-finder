import { ForbiddenError, NotFoundError } from '#src/use-cases/errors/DomainError.js';
import type { IContactRepository } from '#src/use-cases/ports/IContactRepository.js';
import type { IApplicationRepository } from '#src/use-cases/ports/IApplicationRepository.js';
import type {
  IDeleteContactUseCase,
  DeleteContactInput,
} from '#src/use-cases/contacts/IDeleteContactUseCase.js';

interface Deps {
  applicationRepository: IApplicationRepository;
  contactRepository: IContactRepository;
}

export class DeleteContactUseCase implements IDeleteContactUseCase {
  constructor(private readonly deps: Deps) {}

  async execute(input: DeleteContactInput): Promise<void> {
    const contact = await this.deps.contactRepository.findById(input.contactId);
    if (!contact) throw new NotFoundError('Contact not found');

    const app = await this.deps.applicationRepository.findById(contact.applicationId);
    if (!app || app.userId !== input.userId) throw new ForbiddenError('Forbidden');

    await this.deps.contactRepository.delete(input.contactId, contact.applicationId);
  }
}
