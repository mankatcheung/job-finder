export interface PushSubscriptionKeys {
  endpoint: string;
  p256dh: string;
  auth: string;
}

export interface PushPayload {
  title: string;
  body: string;
  url: string;
}

/**
 * Delivering a push notification to one subscription.
 *
 * Only the sending half of `WebPushService` is here: this is what the use case
 * depends on, so it is what the port describes. VAPID key handling stays an
 * infrastructure detail.
 *
 * Rejects when delivery fails — including when VAPID is not configured, which
 * callers treat as any other delivery failure rather than as a special case.
 */
export interface IWebPushService {
  send(subscription: PushSubscriptionKeys, payload: PushPayload): Promise<void>;
}
