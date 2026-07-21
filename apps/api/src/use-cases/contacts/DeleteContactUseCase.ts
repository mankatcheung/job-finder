import type { IContactRepository } from '@/use-cases/ports/IContactRepository.js';
import type { IApplicationRepository } from '@/use-cases/ports/IApplicationRepository.js';
import { ERROR_CODES } from '@/constants.js';
import type {
  IDeleteContactUseCase,
  DeleteContactInput,
} from '@/use-cases/contacts/IDeleteContactUseCase.js';

interface Deps {
  applicationRepository: IApplicationRepository;
  contactRepository: IContactRepository;
}

export class DeleteContactUseCase implements IDeleteContactUseCase {
  constructor(private readonly deps: Deps) {}

  async execute(input: DeleteContactInput): Promise<void> {
    const contact = await this.deps.contactRepository.findById(input.contactId);
    if (!contact)
      throw Object.assign(new Error('Contact not found'), { code: ERROR_CODES.NOT_FOUND });

    const app = await this.deps.applicationRepository.findById(contact.applicationId);
    if (!app || app.userId !== input.userId)
      throw Object.assign(new Error('Forbidden'), { code: ERROR_CODES.FORBIDDEN });

    await this.deps.contactRepository.delete(input.contactId);
  }
}
