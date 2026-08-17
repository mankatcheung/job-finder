import type { IHttpResponse } from '#src/http/ports/IHttpResponse.js';

export interface UploadUrlPayloadDTO {
  uploadUrl: string;
  storageKey: string;
}

import { builder } from '#src/http/schema/builder.js';
import {
  COOKIE_MAX_AGE_S,
  COOKIE_PATH,
  COOKIE_SAME_SITE,
  COOKIES,
  ENV,
  NODE_ENV,
} from '#src/constants.js';

export const UploadUrlPayloadRef = builder.objectRef<UploadUrlPayloadDTO>('UploadUrlPayload');
UploadUrlPayloadRef.implement({
  fields: (t) => ({
    uploadUrl: t.exposeString('uploadUrl'),
    storageKey: t.exposeString('storageKey'),
  }),
});

const isProduction = process.env[ENV.NODE_ENV] === NODE_ENV.PRODUCTION;

// Web and API are deployed on separate subdomains (e.g. www.trakwyn.com /
// api.trakwyn.com) — without an explicit Domain, cookies default to
// host-only on api.trakwyn.com, invisible to document.cookie on
// www.trakwyn.com. COOKIE_DOMAIN (e.g. ".trakwyn.com") shares them across
// both. Leave unset in dev (host-only on localhost is fine there).
const cookieDomain = process.env[ENV.COOKIE_DOMAIN];

// The web app and API are deployed on separate domains, so the refresh
// cookie must be sent cross-site on the fetch to POST /graphql that retries
// it — that requires SameSite=None, which browsers only honor alongside
// Secure. Dev stays Lax since there's no HTTPS to satisfy that requirement.
const COOKIE_BASE = {
  sameSite: isProduction ? 'none' : COOKIE_SAME_SITE,
  path: COOKIE_PATH,
  secure: isProduction,
  ...(cookieDomain ? { domain: cookieDomain } : {}),
} as const;

export function setAuthCookies(
  reply: IHttpResponse,
  accessToken: string,
  refreshToken: string,
): void {
  reply.setCookie(COOKIES.ACCESS_TOKEN, accessToken, {
    ...COOKIE_BASE,
    httpOnly: true,
    maxAge: COOKIE_MAX_AGE_S.ACCESS_TOKEN,
  });
  reply.setCookie(COOKIES.REFRESH_TOKEN, refreshToken, {
    ...COOKIE_BASE,
    httpOnly: true,
    maxAge: COOKIE_MAX_AGE_S.REFRESH_TOKEN,
  });
  reply.setCookie(COOKIES.LOGGED_IN, '1', {
    ...COOKIE_BASE,
    httpOnly: false,
    maxAge: COOKIE_MAX_AGE_S.REFRESH_TOKEN,
  });
}

export function clearAuthCookies(reply: IHttpResponse): void {
  // Must match the Domain the cookie was set with, or the browser treats
  // this as clearing a different (non-existent) cookie and leaves the
  // original in place.
  const clearOptions = { path: COOKIE_PATH, ...(cookieDomain ? { domain: cookieDomain } : {}) };
  reply.clearCookie(COOKIES.ACCESS_TOKEN, clearOptions);
  reply.clearCookie(COOKIES.REFRESH_TOKEN, clearOptions);
  reply.clearCookie(COOKIES.LOGGED_IN, clearOptions);
}
