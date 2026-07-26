import type { Contact } from '#src/domain/contact/Contact.js';

export interface CreateContactData {
  id: string;
  applicationId: string;
  name: string;
  role?: string | null;
  email?: string | null;
  phone?: string | null;
  linkedinUrl?: string | null;
  notes?: string | null;
}

export interface UpdateContactData {
  name?: string;
  role?: string | null;
  email?: string | null;
  phone?: string | null;
  linkedinUrl?: string | null;
  notes?: string | null;
}

export interface IContactRepository {
  findAllByApplicationId(applicationId: string): Promise<Contact[]>;
  findById(id: string): Promise<Contact | null>;
  create(data: CreateContactData): Promise<Contact>;
  update(id: string, data: UpdateContactData): Promise<Contact>;
  delete(id: string): Promise<void>;
}
