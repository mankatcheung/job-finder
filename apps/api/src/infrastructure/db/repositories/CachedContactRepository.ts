import type { Contact } from '#src/domain/contact/Contact.js';
import type {
  IContactRepository,
  CreateContactData,
  UpdateContactData,
} from '#src/use-cases/ports/IContactRepository.js';
import type { MemoryCache } from '#src/infrastructure/cache/MemoryCache.js';
import { CACHE_KEYS } from '#src/constants.js';

interface Deps {
  drizzleContactRepository: IContactRepository;
  cache: MemoryCache;
}

export class CachedContactRepository implements IContactRepository {
  // Tracks which applicationId owns each contact so delete() can invalidate the right list.
  private readonly appIdByContactId = new Map<string, string>();
  private readonly inner: IContactRepository;
  private readonly cache: MemoryCache;

  constructor({ drizzleContactRepository, cache }: Deps) {
    this.inner = drizzleContactRepository;
    this.cache = cache;
  }

  async findAllByApplicationId(applicationId: string): Promise<Contact[]> {
    const key = CACHE_KEYS.contactList(applicationId);
    const hit = this.cache.get<Contact[]>(key);
    if (hit) return hit;

    const result = await this.inner.findAllByApplicationId(applicationId);
    this.cache.set(key, result);
    for (const contact of result) this.appIdByContactId.set(contact.id, contact.applicationId);
    return result;
  }

  async findById(id: string): Promise<Contact | null> {
    const key = CACHE_KEYS.contactById(id);
    const hit = this.cache.get<Contact | null>(key);
    if (hit !== undefined) return hit;

    const result = await this.inner.findById(id);
    this.cache.set(key, result);
    if (result) this.appIdByContactId.set(id, result.applicationId);
    return result;
  }

  async create(data: CreateContactData): Promise<Contact> {
    const result = await this.inner.create(data);
    this.appIdByContactId.set(result.id, result.applicationId);
    this.cache.delete(CACHE_KEYS.contactList(result.applicationId));
    return result;
  }

  async update(id: string, data: UpdateContactData): Promise<Contact> {
    const result = await this.inner.update(id, data);
    this.cache.delete(CACHE_KEYS.contactById(id));
    this.cache.delete(CACHE_KEYS.contactList(result.applicationId));
    this.appIdByContactId.set(id, result.applicationId);
    return result;
  }

  async delete(id: string): Promise<void> {
    const applicationId = this.appIdByContactId.get(id);
    await this.inner.delete(id);
    this.cache.delete(CACHE_KEYS.contactById(id));
    this.appIdByContactId.delete(id);
    if (applicationId) this.cache.delete(CACHE_KEYS.contactList(applicationId));
  }
}
