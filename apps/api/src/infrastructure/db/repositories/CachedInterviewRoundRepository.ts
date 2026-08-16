import type { InterviewRound } from '#src/domain/interviewRound/InterviewRound.js';
import type {
  IInterviewRoundRepository,
  CreateInterviewRoundData,
  UpdateInterviewRoundData,
} from '#src/use-cases/ports/IInterviewRoundRepository.js';
import type { ICache } from '#src/infrastructure/cache/ICache.js';
import { BoundedMap } from '#src/infrastructure/cache/BoundedMap.js';
import { CACHE, CACHE_KEYS } from '#src/constants.js';

interface Deps {
  drizzleInterviewRoundRepository: IInterviewRoundRepository;
  cache: ICache;
}

export class CachedInterviewRoundRepository implements IInterviewRoundRepository {
  private readonly appIdByRoundId = new BoundedMap<string, string>(CACHE.REVERSE_INDEX_MAX_ENTRIES);
  private readonly inner: IInterviewRoundRepository;
  private readonly cache: ICache;

  constructor({ drizzleInterviewRoundRepository, cache }: Deps) {
    this.inner = drizzleInterviewRoundRepository;
    this.cache = cache;
  }

  async findAllByApplicationId(applicationId: string): Promise<InterviewRound[]> {
    const key = CACHE_KEYS.roundList(applicationId);
    const result = await this.cache.getOrSet(key, () =>
      this.inner.findAllByApplicationId(applicationId),
    );
    for (const r of result) this.appIdByRoundId.set(r.id, r.applicationId);
    return result;
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

  async findById(id: string): Promise<InterviewRound | null> {
    const key = CACHE_KEYS.roundById(id);
    const result = await this.cache.getOrSet(key, () => this.inner.findById(id));
    if (result) this.appIdByRoundId.set(id, result.applicationId);
    return result;
  }

  async create(data: CreateInterviewRoundData): Promise<InterviewRound> {
    const result = await this.inner.create(data);
    this.appIdByRoundId.set(result.id, result.applicationId);
    await this.cache.delete(CACHE_KEYS.roundList(result.applicationId));
    return result;
  }

  async update(id: string, data: UpdateInterviewRoundData): Promise<InterviewRound> {
    const result = await this.inner.update(id, data);
    await this.cache.delete(CACHE_KEYS.roundById(id));
    await this.cache.delete(CACHE_KEYS.roundList(result.applicationId));
    this.appIdByRoundId.set(id, result.applicationId);
    return result;
  }

  async updatePushNotificationSentAt(id: string, sentAt: Date): Promise<void> {
    await this.inner.updatePushNotificationSentAt(id, sentAt);
  }

  async delete(id: string): Promise<void> {
    const applicationId = this.appIdByRoundId.get(id);
    await this.inner.delete(id);
    await this.cache.delete(CACHE_KEYS.roundById(id));
    this.appIdByRoundId.delete(id);
    if (applicationId) await this.cache.delete(CACHE_KEYS.roundList(applicationId));
  }
}
