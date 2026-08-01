import type { FastifyRequest, FastifyReply } from 'fastify';
import type { GraphQLContext } from '#src/http/context.js';
import { toHttpRequest } from '#src/http/adapters/fastify/toHttpRequest.js';
import { toHttpResponse } from '#src/http/adapters/fastify/toHttpResponse.js';
import { diScopeOf } from '#src/http/adapters/fastify/diScope.js';
import { AUTH_HEADER, COOKIES } from '#src/constants.js';

export async function buildGraphQLContext(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<GraphQLContext> {
  const diScope = diScopeOf(request);

  const cookieToken = request.cookies[COOKIES.ACCESS_TOKEN];
  const authHeader = request.headers.authorization;
  const bearerToken = authHeader?.startsWith(AUTH_HEADER.BEARER_PREFIX)
    ? authHeader.slice(AUTH_HEADER.BEARER_PREFIX.length)
    : null;
  const rawToken = cookieToken ?? bearerToken;

  const user = rawToken ? await diScope.cradle.authenticateRequestUseCase.execute(rawToken) : null;

  return {
    user,
    diScope,
    request: toHttpRequest(request),
    reply: toHttpResponse(reply),
  };
}
