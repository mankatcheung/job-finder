import type { IContactRepository } from '@/use-cases/ports/IContactRepository.js';
import type { IApplicationRepository } from '@/use-cases/ports/IApplicationRepository.js';
import type { IUpdateContactUseCase, UpdateContactInput, UpdateContactOutput } from '@/use-cases/contacts/IUpdateContactUseCase.js';

interface Deps {
  applicationRepository: IApplicationRepository;
  contactRepository: IContactRepository;
}

export class UpdateContactUseCase implements IUpdateContactUseCase {
  constructor(private readonly deps: Deps) {}

  async execute(input: UpdateContactInput): Promise<UpdateContactOutput> {
    const contact = await this.deps.contactRepository.findById(input.contactId);
    if (!contact) throw Object.assign(new Error('Contact not found'), { code: 'NOT_FOUND' });

    const app = await this.deps.applicationRepository.findById(contact.applicationId);
    if (!app || app.userId !== input.userId)
      throw Object.assign(new Error('Forbidden'), { code: 'FORBIDDEN' });

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
