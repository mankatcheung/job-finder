// Minimal hand-written service worker (no Workbox/build-time precache list —
// see vite.config.ts history for why: vite-plugin-pwa's generated sw.js
// never reached the deployed static output with this app's nitro/Vite
// "environments" build, and its precache manifest scanned the wrong
// directory anyway). Static, hash-named bundle assets under /assets/ are
// cached on first fetch (safe to cache-first since a new deploy ships new
// filenames); everything else — navigation, /graphql, /auth — passes
// straight through to the network untouched.
const CACHE_NAME = 'job-finder-static-v1';

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const names = await caches.keys();
      await Promise.all(
        names.filter((name) => name !== CACHE_NAME).map((name) => caches.delete(name)),
      );
      await self.clients.claim();
    })(),
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || url.origin !== self.location.origin) return;
  if (!url.pathname.startsWith('/assets/')) return;

  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      const cached = await cache.match(event.request);
      if (cached) return cached;

      const response = await fetch(event.request);
      if (response.ok) cache.put(event.request, response.clone());
      return response;
    })(),
  );
});

// ── Push notification support ───────────────────────────────────────────────

self.addEventListener('push', (event) => {
  if (!event.data) return;

  try {
    const payload = event.data.json();
    const { title, body, data } = payload;

    event.waitUntil(
      self.registration.showNotification(title, {
        body,
        icon: '/logo192.png',
        badge: '/favicon.ico',
        data,
        tag: data?.url ?? 'default',
        requireInteraction: false,
        vibrate: [200, 100, 200],
      }),
    );
  } catch {
    // If the payload isn't JSON, try plain text
    const text = event.data.text();
    event.waitUntil(
      self.registration.showNotification('Job Finder', {
        body: text,
        icon: '/logo192.png',
        badge: '/favicon.ico',
      }),
    );
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const urlToOpen = event.notification.data?.url ?? '/dashboard';

  event.waitUntil(
    (async () => {
      const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
      // Focus an existing window if one is already open
      for (const client of clients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          await client.focus();
          await client.postMessage({ type: 'push-notification-click', url: urlToOpen });
          return;
        }
      }
      // Otherwise open a new window
      if (self.clients.openWindow) {
        await self.clients.openWindow(urlToOpen);
      }
    })(),
  );
});
