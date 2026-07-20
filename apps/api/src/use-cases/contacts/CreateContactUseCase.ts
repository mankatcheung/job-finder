import type { IApplicationRepository } from '@/use-cases/ports/IApplicationRepository.js';
import type { IContactRepository } from '@/use-cases/ports/IContactRepository.js';
import type { ICreateContactUseCase, CreateContactInput, CreateContactOutput } from '@/use-cases/contacts/ICreateContactUseCase.js';

interface Deps {
  applicationRepository: IApplicationRepository;
  contactRepository: IContactRepository;
  generateId: () => string;
}

export class CreateContactUseCase implements ICreateContactUseCase {
  constructor(private readonly deps: Deps) {}

  async execute(input: CreateContactInput): Promise<CreateContactOutput> {
    const app = await this.deps.applicationRepository.findById(input.applicationId);
    if (!app) throw Object.assign(new Error('Application not found'), { code: 'NOT_FOUND' });
    if (app.userId !== input.userId) throw Object.assign(new Error('Forbidden'), { code: 'FORBIDDEN' });

    return this.deps.contactRepository.create({
      id: this.deps.generateId(),
      applicationId: input.applicationId,
      name: input.name,
      role: input.role ?? null,
      email: input.email ?? null,
      phone: input.phone ?? null,
      linkedinUrl: input.linkedinUrl ?? null,
      notes: input.notes ?? null,
    });
  }
}
