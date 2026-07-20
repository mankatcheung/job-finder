import type { IApplicationRepository } from '@/use-cases/ports/IApplicationRepository.js';
import type { IContactRepository } from '@/use-cases/ports/IContactRepository.js';
import type { IGetContactsUseCase, GetContactsInput, GetContactsOutput } from '@/use-cases/contacts/IGetContactsUseCase.js';

interface Deps {
  applicationRepository: IApplicationRepository;
  contactRepository: IContactRepository;
}

export class GetContactsUseCase implements IGetContactsUseCase {
  constructor(private readonly deps: Deps) {}

  async execute(input: GetContactsInput): Promise<GetContactsOutput> {
    const app = await this.deps.applicationRepository.findById(input.applicationId);
    if (!app) throw Object.assign(new Error('Application not found'), { code: 'NOT_FOUND' });
    if (app.userId !== input.userId) throw Object.assign(new Error('Forbidden'), { code: 'FORBIDDEN' });

    return this.deps.contactRepository.findAllByApplicationId(input.applicationId);
  }
}
