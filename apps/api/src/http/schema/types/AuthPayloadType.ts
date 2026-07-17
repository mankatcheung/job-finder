import type { FastifyReply } from 'fastify';

export interface UploadUrlPayloadDTO {
  uploadUrl: string;
  storageKey: string;
}

import { builder } from '@/http/schema/builder.js';

export const UploadUrlPayloadRef = builder.objectRef<UploadUrlPayloadDTO>('UploadUrlPayload');
UploadUrlPayloadRef.implement({
  fields: (t) => ({
    uploadUrl: t.exposeString('uploadUrl'),
    storageKey: t.exposeString('storageKey'),
  }),
});

const COOKIE_BASE = {
  sameSite: 'lax',
  path: '/',
  secure: process.env.NODE_ENV === 'production',
} as const;

export function setAuthCookies(
  reply: FastifyReply,
  accessToken: string,
  refreshToken: string,
): void {
  reply.setCookie('jf_access_token', accessToken, {
    ...COOKIE_BASE,
    httpOnly: true,
    maxAge: 15 * 60,
  });
  reply.setCookie('jf_refresh_token', refreshToken, {
    ...COOKIE_BASE,
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60,
  });
  reply.setCookie('jf_logged_in', '1', {
    ...COOKIE_BASE,
    httpOnly: false,
    maxAge: 7 * 24 * 60 * 60,
  });
}

export function clearAuthCookies(reply: FastifyReply): void {
  reply.clearCookie('jf_access_token', { path: '/' });
  reply.clearCookie('jf_refresh_token', { path: '/' });
  reply.clearCookie('jf_logged_in', { path: '/' });
}
