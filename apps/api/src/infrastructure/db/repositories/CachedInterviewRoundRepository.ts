import type { InterviewRound } from '@/domain/interviewRound/InterviewRound.js';
import type {
  IInterviewRoundRepository,
  CreateInterviewRoundData,
  UpdateInterviewRoundData,
} from '@/use-cases/ports/IInterviewRoundRepository.js';
import type { MemoryCache } from '@/infrastructure/cache/MemoryCache.js';

interface Deps {
  prismaInterviewRoundRepository: IInterviewRoundRepository;
  cache: MemoryCache;
}

export class CachedInterviewRoundRepository implements IInterviewRoundRepository {
  private readonly appIdByRoundId = new Map<string, string>();
  private readonly inner: IInterviewRoundRepository;
  private readonly cache: MemoryCache;

  constructor({ prismaInterviewRoundRepository, cache }: Deps) {
    this.inner = prismaInterviewRoundRepository;
    this.cache = cache;
  }

  async findAllByApplicationId(applicationId: string): Promise<InterviewRound[]> {
    const key = `rounds:list:${applicationId}`;
    const hit = this.cache.get<InterviewRound[]>(key);
    if (hit) return hit;

    const result = await this.inner.findAllByApplicationId(applicationId);
    this.cache.set(key, result);
    for (const r of result) this.appIdByRoundId.set(r.id, r.applicationId);
    return result;
  }

  async findById(id: string): Promise<InterviewRound | null> {
    const key = `rounds:byId:${id}`;
    const hit = this.cache.get<InterviewRound | null>(key);
    if (hit !== undefined) return hit;

    const result = await this.inner.findById(id);
    this.cache.set(key, result);
    if (result) this.appIdByRoundId.set(id, result.applicationId);
    return result;
  }

  async create(data: CreateInterviewRoundData): Promise<InterviewRound> {
    const result = await this.inner.create(data);
    this.appIdByRoundId.set(result.id, result.applicationId);
    this.cache.delete(`rounds:list:${result.applicationId}`);
    return result;
  }

  async update(id: string, data: UpdateInterviewRoundData): Promise<InterviewRound> {
    const result = await this.inner.update(id, data);
    this.cache.delete(`rounds:byId:${id}`);
    this.cache.delete(`rounds:list:${result.applicationId}`);
    this.appIdByRoundId.set(id, result.applicationId);
    return result;
  }

  async delete(id: string): Promise<void> {
    const applicationId = this.appIdByRoundId.get(id);
    await this.inner.delete(id);
    this.cache.delete(`rounds:byId:${id}`);
    this.appIdByRoundId.delete(id);
    if (applicationId) this.cache.delete(`rounds:list:${applicationId}`);
  }
}
