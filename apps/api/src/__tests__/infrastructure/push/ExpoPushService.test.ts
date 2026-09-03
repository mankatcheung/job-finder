import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ExpoPushService } from '#src/infrastructure/push/ExpoPushService.js';

describe('ExpoPushService', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = vi.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('posts to the Expo push API with the token, title, body, and url', async () => {
    vi.mocked(global.fetch).mockResolvedValue(
      new Response(JSON.stringify({ data: [{ status: 'ok' }] }), { status: 200 }),
    );

    const service = new ExpoPushService();
    await service.send('ExponentPushToken[abc123]', {
      title: 'Upcoming interview: Acme',
      body: 'Phone interview tomorrow at 10:00 AM',
      url: '/applications/app-1?section=interviews',
    });

    expect(global.fetch).toHaveBeenCalledWith(
      'https://exp.host/--/api/v2/push/send',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          to: 'ExponentPushToken[abc123]',
          title: 'Upcoming interview: Acme',
          body: 'Phone interview tomorrow at 10:00 AM',
          data: { url: '/applications/app-1?section=interviews' },
        }),
      }),
    );
  });

  it('throws when the HTTP response is not ok', async () => {
    vi.mocked(global.fetch).mockResolvedValue(new Response('', { status: 500 }));

    const service = new ExpoPushService();
    await expect(
      service.send('ExponentPushToken[abc123]', { title: 't', body: 'b', url: '/u' }),
    ).rejects.toThrow('status 500');
  });

  it('throws an error carrying the Expo ticket error code when delivery fails', async () => {
    vi.mocked(global.fetch).mockResolvedValue(
      new Response(
        JSON.stringify({
          data: [
            {
              status: 'error',
              message: 'The Expo push token is not a valid Expo push token',
              details: { error: 'DeviceNotRegistered' },
            },
          ],
        }),
        { status: 200 },
      ),
    );

    const service = new ExpoPushService();
    const promise = service.send('bad-token', { title: 't', body: 'b', url: '/u' });

    await expect(promise).rejects.toThrow('The Expo push token is not a valid Expo push token');
    await promise.catch((err: Error & { code?: string }) => {
      expect(err.code).toBe('DeviceNotRegistered');
    });
  });
});
