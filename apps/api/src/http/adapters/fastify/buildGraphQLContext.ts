import type { FastifyRequest, FastifyReply } from 'fastify';
import type { GraphQLContext, JwtUser } from '@/http/context.js';
import { toHttpRequest } from '@/http/adapters/fastify/toHttpRequest.js';
import { toHttpResponse } from '@/http/adapters/fastify/toHttpResponse.js';
import { diScopeOf } from '@/http/adapters/fastify/diScope.js';
import { API_TOKEN, API_TOKEN_SCOPE, AUTH_HEADER, COOKIES } from '@/constants.js';

export async function buildGraphQLContext(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<GraphQLContext> {
  const diScope = diScopeOf(request);
  let user: JwtUser | null = null;

  const cookieToken = request.cookies[COOKIES.ACCESS_TOKEN];
  const authHeader = request.headers.authorization;
  const bearerToken = authHeader?.startsWith(AUTH_HEADER.BEARER_PREFIX)
    ? authHeader.slice(AUTH_HEADER.BEARER_PREFIX.length)
    : null;
  const rawToken = cookieToken ?? bearerToken;

  if (rawToken) {
    if (rawToken.startsWith(API_TOKEN.PREFIX)) {
      // API token path — hash and look up in DB
      // Read-scoped tokens are MCP-only and cannot authenticate GraphQL
      try {
        const { validateApiTokenUseCase } = diScope.cradle;
        const result = await validateApiTokenUseCase.execute(rawToken);
        if (result && result.scope === API_TOKEN_SCOPE.FULL) {
          user = { sub: result.sub, email: result.email };
        }
      } catch {
        // Invalid API token — unauthenticated
      }
    } else {
      // JWT path
      try {
        const { tokenService } = diScope.cradle;
        user = tokenService.verifyAccess(rawToken);
      } catch {
        // Expired/invalid token — resolvers enforce auth
      }
    }
  }

  return {
    user,
    diScope,
    request: toHttpRequest(request),
    reply: toHttpResponse(reply),
  };
}
