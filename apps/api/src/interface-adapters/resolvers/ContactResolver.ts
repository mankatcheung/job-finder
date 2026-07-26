import type { ICreateContactUseCase } from '#src/use-cases/contacts/ICreateContactUseCase.js';
import type { IGetContactsUseCase } from '#src/use-cases/contacts/IGetContactsUseCase.js';
import type { IUpdateContactUseCase } from '#src/use-cases/contacts/IUpdateContactUseCase.js';
import type { IDeleteContactUseCase } from '#src/use-cases/contacts/IDeleteContactUseCase.js';
import type { ContactMapper, ContactDTO } from '#src/interface-adapters/mappers/ContactMapper.js';

interface Deps {
  createContactUseCase: ICreateContactUseCase;
  getContactsUseCase: IGetContactsUseCase;
  updateContactUseCase: IUpdateContactUseCase;
  deleteContactUseCase: IDeleteContactUseCase;
  contactMapper: ContactMapper;
}

interface CreateInput {
  applicationId: string;
  name: string;
  role?: string | null;
  email?: string | null;
  phone?: string | null;
  linkedinUrl?: string | null;
  notes?: string | null;
}

interface UpdateInput {
  name?: string;
  role?: string | null;
  email?: string | null;
  phone?: string | null;
  linkedinUrl?: string | null;
  notes?: string | null;
}

export class ContactResolver {
  constructor(private readonly deps: Deps) {}

  async getContacts(userId: string, applicationId: string): Promise<ContactDTO[]> {
    const contacts = await this.deps.getContactsUseCase.execute({ userId, applicationId });
    return contacts.map((c) => this.deps.contactMapper.toDTO(c));
  }

  async createContact(userId: string, input: CreateInput): Promise<ContactDTO> {
    const contact = await this.deps.createContactUseCase.execute({ userId, ...input });
    return this.deps.contactMapper.toDTO(contact);
  }

  async updateContact(userId: string, contactId: string, input: UpdateInput): Promise<ContactDTO> {
    const contact = await this.deps.updateContactUseCase.execute({ userId, contactId, ...input });
    return this.deps.contactMapper.toDTO(contact);
  }

  async deleteContact(userId: string, contactId: string): Promise<boolean> {
    await this.deps.deleteContactUseCase.execute({ userId, contactId });
    return true;
  }
}
