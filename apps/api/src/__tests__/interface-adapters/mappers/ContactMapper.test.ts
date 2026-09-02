import { describe, it, expect } from 'vitest';
import { ContactMapper } from '#src/interface-adapters/mappers/ContactMapper.js';
import { makeContact } from '#src/__tests__/helpers/mocks/contacts.js';

describe('ContactMapper', () => {
  const mapper = new ContactMapper();

  it('converts createdAt and updatedAt to ISO strings', () => {
    const contact = makeContact({
      createdAt: new Date('2024-04-01T00:00:00.000Z'),
      updatedAt: new Date('2024-04-02T00:00:00.000Z'),
    });

    const dto = mapper.toDTO(contact);

    expect(dto.createdAt).toBe('2024-04-01T00:00:00.000Z');
    expect(dto.updatedAt).toBe('2024-04-02T00:00:00.000Z');
  });

  it('passes nullable fields through as null instead of throwing', () => {
    const contact = makeContact({
      role: null,
      email: null,
      phone: null,
      linkedinUrl: null,
      notes: null,
    });

    const dto = mapper.toDTO(contact);

    expect(dto.role).toBeNull();
    expect(dto.email).toBeNull();
    expect(dto.phone).toBeNull();
    expect(dto.linkedinUrl).toBeNull();
    expect(dto.notes).toBeNull();
  });

  it('passes scalar fields through unchanged', () => {
    const contact = makeContact({
      id: 'contact-xyz',
      applicationId: 'app-abc',
      name: 'Jane Doe',
      role: 'Recruiter',
      email: 'jane@example.com',
    });

    const dto = mapper.toDTO(contact);

    expect(dto.id).toBe('contact-xyz');
    expect(dto.applicationId).toBe('app-abc');
    expect(dto.name).toBe('Jane Doe');
    expect(dto.role).toBe('Recruiter');
    expect(dto.email).toBe('jane@example.com');
  });
});
