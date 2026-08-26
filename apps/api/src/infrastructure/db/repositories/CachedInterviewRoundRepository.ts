import type { InterviewRound } from '#src/domain/interviewRound/InterviewRound.js';
import type {
  IInterviewRoundRepository,
  CreateInterviewRoundData,
  UpdateInterviewRoundData,
} from '#src/use-cases/ports/IInterviewRoundRepository.js';
import type { ICache } from '#src/infrastructure/cache/ICache.js';
import { CACHE_KEYS } from '#src/constants.js';

interface Deps {
  drizzleInterviewRoundRepository: IInterviewRoundRepository;
  cache: ICache;
}

export class CachedInterviewRoundRepository implements IInterviewRoundRepository {
  private readonly inner: IInterviewRoundRepository;
  private readonly cache: ICache;

  constructor({ drizzleInterviewRoundRepository, cache }: Deps) {
    this.inner = drizzleInterviewRoundRepository;
    this.cache = cache;
  }

  async findAllByApplicationId(applicationId: string): Promise<InterviewRound[]> {
    const key = CACHE_KEYS.roundList(applicationId);
    return this.cache.getOrSet(key, () => this.inner.findAllByApplicationId(applicationId));
  }

  // Not cached: this reads across every application for the user, which
  // doesn't fit the per-applicationId cache key scheme used above, and
  // invalidating it correctly would require busting it on every round
  // create/update/delete for any of the user's applications.
  async findAllByUserId(userId: string): Promise<InterviewRound[]> {
    return this.inner.findAllByUserId(userId);
  }

  // Not cached: the time window changes on every call.
  async findUpcomingWithinWindow(windowMs: number): Promise<InterviewRound[]> {
    return this.inner.findUpcomingWithinWindow(windowMs);
  }

  /**
   * Not cached, matching `CachedDocumentRepository.countByApplicationId`. A
   * single COUNT(*) isn't worth a dedicated cache key and invalidation path.
   */
  async countByApplicationId(applicationId: string): Promise<number> {
    return this.inner.countByApplicationId(applicationId);
  }

  async findById(id: string): Promise<InterviewRound | null> {
    const key = CACHE_KEYS.roundById(id);
    return this.cache.getOrSet(key, () => this.inner.findById(id));
  }

  async create(data: CreateInterviewRoundData): Promise<InterviewRound> {
    const result = await this.inner.create(data);
    await this.cache.delete(CACHE_KEYS.roundList(result.applicationId));
    return result;
  }

  async update(id: string, data: UpdateInterviewRoundData): Promise<InterviewRound> {
    const result = await this.inner.update(id, data);
    await this.cache.delete(CACHE_KEYS.roundById(id));
    await this.cache.delete(CACHE_KEYS.roundList(result.applicationId));
    return result;
  }

  async updatePushNotificationSentAt(id: string, sentAt: Date): Promise<void> {
    const existing = await this.findById(id);
    await this.inner.updatePushNotificationSentAt(id, sentAt);
    await this.cache.delete(CACHE_KEYS.roundById(id));
    if (existing) await this.cache.delete(CACHE_KEYS.roundList(existing.applicationId));
  }

  async delete(id: string, applicationId: string): Promise<void> {
    await this.inner.delete(id, applicationId);
    await this.cache.delete(CACHE_KEYS.roundById(id));
    await this.cache.delete(CACHE_KEYS.roundList(applicationId));
  }
}
