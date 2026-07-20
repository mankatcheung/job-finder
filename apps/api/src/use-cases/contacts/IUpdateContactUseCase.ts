import type { Contact } from '@/domain/contact/Contact.js';

export interface UpdateContactInput {
  userId: string;
  contactId: string;
  name?: string;
  role?: string | null;
  email?: string | null;
  phone?: string | null;
  linkedinUrl?: string | null;
  notes?: string | null;
}

export type UpdateContactOutput = Contact;

export interface IUpdateContactUseCase {
  execute(input: UpdateContactInput): Promise<UpdateContactOutput>;
}
