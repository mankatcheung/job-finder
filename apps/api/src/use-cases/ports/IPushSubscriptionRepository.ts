import type { PushSubscription } from '#src/domain/pushSubscription/PushSubscription.js';

export interface IPushSubscriptionRepository {
  findByUserId(userId: string): Promise<PushSubscription[]>;
  findByEndpoint(endpoint: string): Promise<PushSubscription | null>;
  upsert(
    subscription: Omit<PushSubscription, 'createdAt' | 'updatedAt'>,
  ): Promise<PushSubscription>;
  deleteByEndpoint(endpoint: string): Promise<void>;
  deleteByUserId(userId: string): Promise<void>;
}
