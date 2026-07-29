import type { FastifyRequest } from 'fastify';
import type { Cradle } from '#src/http/container.js';
import type { JwtUser } from '#src/http/context.js';
import { API_TOKEN, API_TOKEN_SCOPE, AUTH_HEADER, COOKIES } from '#src/constants.js';

/**
 * Pull a user identity out of any of the three supported credentials
 * (cookie session, Bearer JWT, API token) — same precedence as the
 * GraphQL context builder so file reads behave like an attached GraphQL
 * request.
 */
export async function authenticateRequest(
  rawRequest: FastifyRequest,
  cradle: Cradle,
): Promise<JwtUser | null> {
  const cookieToken = rawRequest.cookies[COOKIES.ACCESS_TOKEN];
  const authHeader = rawRequest.headers.authorization;
  const bearerToken =
    typeof authHeader === 'string' && authHeader.startsWith(AUTH_HEADER.BEARER_PREFIX)
      ? authHeader.slice(AUTH_HEADER.BEARER_PREFIX.length)
      : null;
  const rawToken = cookieToken ?? bearerToken;
  if (!rawToken) return null;

  if (rawToken.startsWith(API_TOKEN.PREFIX)) {
    try {
      const result = await cradle.validateApiTokenUseCase.execute(rawToken);
      if (result?.scope === API_TOKEN_SCOPE.FULL) {
        return { sub: result.sub, email: result.email };
      }
      return null;
    } catch {
      return null;
    }
  }

  try {
    return cradle.tokenService.verifyAccess(rawToken);
  } catch {
    return null;
  }
}
