import type { FastifyRequest, FastifyReply } from 'fastify';
import { gql, gqlRaw, UnauthorizedError } from './gql.js';
import { COOKIES, ERROR_CODES } from '../constants.js';

const REFRESH = `mutation { refreshToken }`;

export async function authedGql<T>(
  request: FastifyRequest,
  reply: FastifyReply,
  query: string,
  variables: Record<string, unknown> = {},
): Promise<T> {
  const cookie = request.headers.cookie ?? '';
  try {
    return await gql<T>(query, variables, cookie);
  } catch (err) {
    if (!(err instanceof UnauthorizedError)) throw err;

    // Try refresh — capture Set-Cookie to forward to browser and use for retry
    try {
      const refreshRes = await gqlRaw(REFRESH, {}, cookie);
      const refreshJson = (await refreshRes.json()) as {
        errors?: Array<{ extensions?: { code?: string } }>;
      };
      if (refreshJson.errors?.some((e) => e.extensions?.code === ERROR_CODES.UNAUTHORIZED)) {
        throw new UnauthorizedError();
      }

      // Forward new cookies to browser
      const setCookies = refreshRes.headers.getSetCookie?.() ?? [];
      for (const c of setCookies) {
        void reply.header('set-cookie', c);
      }

      // Build updated cookie string for retry
      const newCookieMap = new Map<string, string>();
      // Parse existing cookies
      for (const part of cookie.split(';')) {
        const [k, ...rest] = part.trim().split('=');
        if (k) newCookieMap.set(k, rest.join('='));
      }
      // Overlay new cookies from refresh response
      for (const c of setCookies) {
        const [nameVal] = c.split(';');
        const eqIdx = (nameVal ?? '').indexOf('=');
        if (eqIdx > 0) {
          const name = (nameVal ?? '').slice(0, eqIdx).trim();
          const val = (nameVal ?? '').slice(eqIdx + 1).trim();
          newCookieMap.set(name, val);
        }
      }
      const updatedCookie = Array.from(newCookieMap.entries())
        .map(([k, v]) => `${k}=${v}`)
        .join('; ');

      return await gql<T>(query, variables, updatedCookie);
    } catch {
      await reply.redirect('/login');
      throw new Error('Redirecting');
    }
  }
}

export function requireAuth(request: FastifyRequest, reply: FastifyReply): boolean {
  const cookie = request.headers.cookie ?? '';
  if (!cookie.includes(COOKIES.ACCESS_TOKEN)) {
    void reply.redirect('/login');
    return false;
  }
  return true;
}
