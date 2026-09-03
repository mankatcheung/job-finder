import type { PushPayload } from '#src/use-cases/ports/IWebPushService.js';

/**
 * Delivering a push notification to one Expo push token — the mobile
 * counterpart of IWebPushService. Rejects when delivery fails; a rejection
 * whose `code` is 'DeviceNotRegistered' means the token is permanently
 * dead (app uninstalled, token rotated) and the caller should stop
 * retrying it, mirroring how web push signals an expired subscription with
 * a 410 status.
 */
export interface IExpoPushService {
  send(expoPushToken: string, payload: PushPayload): Promise<void>;
}
