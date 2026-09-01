import type { Contact } from '#src/domain/contact/Contact.js';
import type {
  IContactRepository,
  CreateContactData,
  UpdateContactData,
} from '#src/use-cases/ports/IContactRepository.js';
import type { ICache } from '#src/infrastructure/cache/ICache.js';
import { CACHE_KEYS } from '#src/infrastructure/config/constants.js';

interface Deps {
  drizzleContactRepository: IContactRepository;
  cache: ICache;
}

export class CachedContactRepository implements IContactRepository {
  private readonly inner: IContactRepository;
  private readonly cache: ICache;

  constructor({ drizzleContactRepository, cache }: Deps) {
    this.inner = drizzleContactRepository;
    this.cache = cache;
  }

  async findAllByApplicationId(applicationId: string): Promise<Contact[]> {
    const key = CACHE_KEYS.contactList(applicationId);
    return this.cache.getOrSet(key, () => this.inner.findAllByApplicationId(applicationId));
  }

  /**
   * Not cached, matching `CachedDocumentRepository.countByApplicationId`. A
   * single COUNT(*) isn't worth a dedicated cache key and invalidation path.
   */
  async countByApplicationId(applicationId: string): Promise<number> {
    return this.inner.countByApplicationId(applicationId);
  }

  async findById(id: string): Promise<Contact | null> {
    const key = CACHE_KEYS.contactById(id);
    return this.cache.getOrSet(key, () => this.inner.findById(id));
  }

  async create(data: CreateContactData): Promise<Contact> {
    const result = await this.inner.create(data);
    await this.cache.delete(CACHE_KEYS.contactList(result.applicationId));
    return result;
  }

  async update(id: string, data: UpdateContactData): Promise<Contact> {
    const result = await this.inner.update(id, data);
    await this.cache.delete(CACHE_KEYS.contactById(id));
    await this.cache.delete(CACHE_KEYS.contactList(result.applicationId));
    return result;
  }

  async delete(id: string, applicationId: string): Promise<void> {
    await this.inner.delete(id, applicationId);
    await this.cache.delete(CACHE_KEYS.contactById(id));
    await this.cache.delete(CACHE_KEYS.contactList(applicationId));
  }
}
