import type { Contact } from '#src/domain/contact/Contact.js';

export interface ContactDTO {
  id: string;
  applicationId: string;
  name: string;
  role: string | null;
  email: string | null;
  phone: string | null;
  linkedinUrl: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export class ContactMapper {
  toDTO(contact: Contact): ContactDTO {
    return {
      id: contact.id,
      applicationId: contact.applicationId,
      name: contact.name,
      role: contact.role,
      email: contact.email,
      phone: contact.phone,
      linkedinUrl: contact.linkedinUrl,
      notes: contact.notes,
      createdAt: contact.createdAt.toISOString(),
      updatedAt: contact.updatedAt.toISOString(),
    };
  }
}
