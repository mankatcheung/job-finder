import { ENV } from '#src/constants.js';

/**
 * Thin wrapper around the Web Push API using the `web-push` library.
 * VAPID keys are read from env vars at construction time.
 */
export class WebPushService {
  private readonly publicKey: string;
  private readonly privateKey: string;
  private readonly subject: string;
  private readonly isConfigured: boolean;

  constructor() {
    this.publicKey = process.env[ENV.VAPID_PUBLIC_KEY] ?? '';
    this.privateKey = process.env[ENV.VAPID_PRIVATE_KEY] ?? '';
    this.subject = process.env[ENV.VAPID_SUBJECT] ?? 'mailto:noreply@trakwyn.app';
    this.isConfigured = Boolean(this.publicKey && this.privateKey);
  }

  getVapidPublicKey(): string {
    return this.publicKey;
  }

  async send(
    subscription: { endpoint: string; p256dh: string; auth: string },
    payload: { title: string; body: string; url: string },
  ): Promise<void> {
    if (!this.isConfigured) {
      throw new Error('VAPID keys not configured');
    }

    // Dynamic import so web-push is only loaded when actually needed
    const webpush = await import('web-push');
    webpush.setVapidDetails(this.subject, this.publicKey, this.privateKey);

    await webpush.sendNotification(
      {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: subscription.p256dh,
          auth: subscription.auth,
        },
      },
      JSON.stringify({
        title: payload.title,
        body: payload.body,
        data: { url: payload.url },
      }),
    );
  }
}
