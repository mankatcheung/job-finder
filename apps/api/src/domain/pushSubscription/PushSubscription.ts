export type PushSubscriptionProvider = 'web' | 'expo';

export interface PushSubscription {
  id: string;
  userId: string;
  provider: PushSubscriptionProvider;
  /** A web-push endpoint URL for 'web'; the Expo push token itself for 'expo'. */
  endpoint: string;
  /** VAPID key material — null for 'expo' subscriptions. */
  p256dh: string | null;
  auth: string | null;
  createdAt: Date;
  updatedAt: Date;
}
