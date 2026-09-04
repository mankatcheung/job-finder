// Notification `url`s are written server-side as web paths, e.g.
// `/applications/{id}?section=interviews` (see
// apps/api/src/use-cases/push/SendPushNotificationsUseCase.ts). Mobile has no
// browser to follow that link, so this maps the one shape we actually emit
// (an application deep link) onto the equivalent Expo Router path, dropping
// the web-only `?section=` query since the mobile detail screen has no
// matching section param.
export function resolveNotificationRoute(url: string | null): string | null {
  if (!url) return null;
  const match = /^\/applications\/([^/?]+)/.exec(url);
  if (!match) return null;
  return `/applications/${match[1]}`;
}
