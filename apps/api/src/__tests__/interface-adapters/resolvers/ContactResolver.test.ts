import { describe, it, expect, vi } from 'vitest';
import { ContactResolver } from '@/interface-adapters/resolvers/ContactResolver.js';
import { ContactMapper } from '@/interface-adapters/mappers/ContactMapper.js';
import { makeContact } from '@/__tests__/helpers/mocks.js';
import type { ICreateContactUseCase } from '@/use-cases/contacts/ICreateContactUseCase.js';
import type { IGetContactsUseCase } from '@/use-cases/contacts/IGetContactsUseCase.js';
import type { IUpdateContactUseCase } from '@/use-cases/contacts/IUpdateContactUseCase.js';
import type { IDeleteContactUseCase } from '@/use-cases/contacts/IDeleteContactUseCase.js';

const stub = <T>(methods: Partial<T>): T => methods as T;

const makeDeps = (overrides?: object) => ({
  createContactUseCase: stub<ICreateContactUseCase>({ execute: vi.fn() }),
  getContactsUseCase: stub<IGetContactsUseCase>({ execute: vi.fn() }),
  updateContactUseCase: stub<IUpdateContactUseCase>({ execute: vi.fn() }),
  deleteContactUseCase: stub<IDeleteContactUseCase>({ execute: vi.fn() }),
  contactMapper: new ContactMapper(),
  ...overrides,
});

describe('ContactResolver', () => {
  it('getContacts: delegates to the use case and maps each contact to a DTO', async () => {
    const contacts = [makeContact({ id: 'contact-1' }), makeContact({ id: 'contact-2' })];
    const deps = makeDeps({
      getContactsUseCase: stub<IGetContactsUseCase>({
        execute: vi.fn().mockResolvedValue(contacts),
      }),
    });

    const resolver = new ContactResolver(deps);
    const result = await resolver.getContacts('user-1', 'app-1');

    expect(deps.getContactsUseCase.execute).toHaveBeenCalledWith({
      userId: 'user-1',
      applicationId: 'app-1',
    });
    expect(result).toHaveLength(2);
    expect(result[0].id).toBe('contact-1');
  });

  it('createContact: passes userId and input through and returns the mapped DTO', async () => {
    const contact = makeContact({ id: 'contact-1', name: 'Jane Doe' });
    const deps = makeDeps({
      createContactUseCase: stub<ICreateContactUseCase>({
        execute: vi.fn().mockResolvedValue(contact),
      }),
    });

    const resolver = new ContactResolver(deps);
    const result = await resolver.createContact('user-1', {
      applicationId: 'app-1',
      name: 'Jane Doe',
    });

    expect(deps.createContactUseCase.execute).toHaveBeenCalledWith({
      userId: 'user-1',
      applicationId: 'app-1',
      name: 'Jane Doe',
    });
    expect(result.id).toBe('contact-1');
    expect(result.name).toBe('Jane Doe');
  });

  it('updateContact: passes userId, contactId and input through and returns the mapped DTO', async () => {
    const contact = makeContact({ id: 'contact-1', role: 'Recruiter' });
    const deps = makeDeps({
      updateContactUseCase: stub<IUpdateContactUseCase>({
        execute: vi.fn().mockResolvedValue(contact),
      }),
    });

    const resolver = new ContactResolver(deps);
    const result = await resolver.updateContact('user-1', 'contact-1', { role: 'Recruiter' });

    expect(deps.updateContactUseCase.execute).toHaveBeenCalledWith({
      userId: 'user-1',
      contactId: 'contact-1',
      role: 'Recruiter',
    });
    expect(result.role).toBe('Recruiter');
  });

  it('deleteContact: calls the use case and returns true', async () => {
    const deps = makeDeps({
      deleteContactUseCase: stub<IDeleteContactUseCase>({
        execute: vi.fn().mockResolvedValue(undefined),
      }),
    });

    const resolver = new ContactResolver(deps);
    const result = await resolver.deleteContact('user-1', 'contact-1');

    expect(deps.deleteContactUseCase.execute).toHaveBeenCalledWith({
      userId: 'user-1',
      contactId: 'contact-1',
    });
    expect(result).toBe(true);
  });
});
