import type { IHttpRequest } from '#src/http/ports/IHttpRequest.js';
import { AUTH_HEADER, ENV } from '#src/constants.js';

/**
 * Shared auth check for the admin/cron-triggered routes (digest, reminders).
 * Accepts either the route's own dedicated secret (for manual/external
 * triggering) or CRON_SECRET (Vercel Cron's reserved env var name — Vercel
 * auto-injects it as `Authorization: Bearer $CRON_SECRET` on scheduled
 * invocations, and it never has to be committed anywhere since Vercel Cron
 * can't send custom headers of its own).
 */
export function isAuthorizedCronTrigger(request: IHttpRequest, ownSecretEnvKey: string): boolean {
  const auth = request.headers.authorization;
  if (typeof auth !== 'string' || !auth.startsWith(AUTH_HEADER.BEARER_PREFIX)) return false;

  const token = auth.slice(AUTH_HEADER.BEARER_PREFIX.length);
  const ownSecret = process.env[ownSecretEnvKey];
  const cronSecret = process.env[ENV.CRON_SECRET];

  return (
    (Boolean(ownSecret) && token === ownSecret) || (Boolean(cronSecret) && token === cronSecret)
  );
}
