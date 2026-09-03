import type { IExpoPushService } from '#src/use-cases/ports/IExpoPushService.js';
import type { PushPayload } from '#src/use-cases/ports/IWebPushService.js';

const EXPO_PUSH_API_URL = 'https://exp.host/--/api/v2/push/send';

interface ExpoPushTicket {
  status: 'ok' | 'error';
  message?: string;
  details?: { error?: string };
}

interface ExpoPushResponse {
  data?: ExpoPushTicket[];
  errors?: unknown[];
}

/**
 * Thin wrapper around Expo's push notification HTTP API — no SDK needed,
 * it's a single unauthenticated (by default) JSON POST. See
 * https://docs.expo.dev/push-notifications/sending-notifications/#http2-api.
 */
export class ExpoPushService implements IExpoPushService {
  async send(expoPushToken: string, payload: PushPayload): Promise<void> {
    const response = await fetch(EXPO_PUSH_API_URL, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: expoPushToken,
        title: payload.title,
        body: payload.body,
        data: { url: payload.url },
      }),
    });

    if (!response.ok) {
      throw new Error(`Expo push API responded with status ${response.status}`);
    }

    const result = (await response.json()) as ExpoPushResponse;
    const ticket = result.data?.[0];
    if (ticket?.status === 'error') {
      const error = new Error(ticket.message ?? 'Expo push delivery failed') as Error & {
        code?: string;
      };
      error.code = ticket.details?.error;
      throw error;
    }
  }
}
