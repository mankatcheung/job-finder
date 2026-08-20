import { ForbiddenError, NotFoundError } from '#src/use-cases/errors/DomainError.js';
import type { IContactRepository } from '#src/use-cases/ports/IContactRepository.js';
import type { IApplicationRepository } from '#src/use-cases/ports/IApplicationRepository.js';
import type {
  IUpdateContactUseCase,
  UpdateContactInput,
  UpdateContactOutput,
} from '#src/use-cases/contacts/IUpdateContactUseCase.js';

interface Deps {
  applicationRepository: IApplicationRepository;
  contactRepository: IContactRepository;
}

export class UpdateContactUseCase implements IUpdateContactUseCase {
  constructor(private readonly deps: Deps) {}

  async execute(input: UpdateContactInput): Promise<UpdateContactOutput> {
    const contact = await this.deps.contactRepository.findById(input.contactId);
    if (!contact) throw new NotFoundError('Contact not found');

    const app = await this.deps.applicationRepository.findById(contact.applicationId);
    if (!app || app.userId !== input.userId) throw new ForbiddenError('Forbidden');

    return this.deps.contactRepository.update(input.contactId, {
      name: input.name,
      role: input.role,
      email: input.email,
      phone: input.phone,
      linkedinUrl: input.linkedinUrl,
      notes: input.notes,
    });
  }
}
