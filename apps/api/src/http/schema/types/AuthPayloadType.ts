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

// The web app and API are deployed on separate domains, so the refresh
// cookie must be sent cross-site on the fetch to POST /graphql that retries
// it — that requires SameSite=None, which browsers only honor alongside
// Secure. Dev stays Lax since there's no HTTPS to satisfy that requirement.
const COOKIE_BASE = {
  sameSite: isProduction ? 'none' : COOKIE_SAME_SITE,
  path: COOKIE_PATH,
  secure: isProduction,
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
  reply.clearCookie(COOKIES.ACCESS_TOKEN, { path: COOKIE_PATH });
  reply.clearCookie(COOKIES.REFRESH_TOKEN, { path: COOKIE_PATH });
  reply.clearCookie(COOKIES.LOGGED_IN, { path: COOKIE_PATH });
}
