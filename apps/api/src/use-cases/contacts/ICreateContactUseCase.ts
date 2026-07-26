import type { Contact } from '#src/domain/contact/Contact.js';

export interface CreateContactInput {
  userId: string;
  applicationId: string;
  name: string;
  role?: string | null;
  email?: string | null;
  phone?: string | null;
  linkedinUrl?: string | null;
  notes?: string | null;
}

export type CreateContactOutput = Contact;

export interface ICreateContactUseCase {
  execute(input: CreateContactInput): Promise<CreateContactOutput>;
}
