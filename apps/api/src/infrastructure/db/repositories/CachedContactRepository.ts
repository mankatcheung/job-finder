import type { Contact } from '#src/domain/contact/Contact.js';
import type {
  IContactRepository,
  CreateContactData,
  UpdateContactData,
} from '#src/use-cases/ports/IContactRepository.js';
import type { ICache } from '#src/infrastructure/cache/ICache.js';
import { BoundedMap } from '#src/infrastructure/cache/BoundedMap.js';
import { CACHE, CACHE_KEYS } from '#src/constants.js';

interface Deps {
  drizzleContactRepository: IContactRepository;
  cache: ICache;
}

export class CachedContactRepository implements IContactRepository {
  // Tracks which applicationId owns each contact so delete() can invalidate the right list.
  private readonly appIdByContactId = new BoundedMap<string, string>(
    CACHE.REVERSE_INDEX_MAX_ENTRIES,
  );
  private readonly inner: IContactRepository;
  private readonly cache: ICache;

  constructor({ drizzleContactRepository, cache }: Deps) {
    this.inner = drizzleContactRepository;
    this.cache = cache;
  }

  async findAllByApplicationId(applicationId: string): Promise<Contact[]> {
    const key = CACHE_KEYS.contactList(applicationId);
    const result = await this.cache.getOrSet(key, () =>
      this.inner.findAllByApplicationId(applicationId),
    );
    for (const contact of result) this.appIdByContactId.set(contact.id, contact.applicationId);
    return result;
  }

  /**
   * Not cached, deliberately. The count and the cached list are read at
   * different moments by the detail page, and caching both invites a badge
   * saying 3 over a list showing 2. A COUNT(*) is cheap; a wrong number the
   * user can see is not.
   */
  async countByApplicationId(applicationId: string): Promise<number> {
    return this.inner.countByApplicationId(applicationId);
  }

  async findById(id: string): Promise<Contact | null> {
    const key = CACHE_KEYS.contactById(id);
    const result = await this.cache.getOrSet(key, () => this.inner.findById(id));
    if (result) this.appIdByContactId.set(id, result.applicationId);
    return result;
  }

  async create(data: CreateContactData): Promise<Contact> {
    const result = await this.inner.create(data);
    this.appIdByContactId.set(result.id, result.applicationId);
    await this.cache.delete(CACHE_KEYS.contactList(result.applicationId));
    return result;
  }

  async update(id: string, data: UpdateContactData): Promise<Contact> {
    const result = await this.inner.update(id, data);
    await this.cache.delete(CACHE_KEYS.contactById(id));
    await this.cache.delete(CACHE_KEYS.contactList(result.applicationId));
    this.appIdByContactId.set(id, result.applicationId);
    return result;
  }

  async delete(id: string): Promise<void> {
    const applicationId = this.appIdByContactId.get(id);
    await this.inner.delete(id);
    await this.cache.delete(CACHE_KEYS.contactById(id));
    this.appIdByContactId.delete(id);
    if (applicationId) await this.cache.delete(CACHE_KEYS.contactList(applicationId));
  }
}
