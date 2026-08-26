import type { FastifyRequest, FastifyReply } from 'fastify';
import type { GraphQLContext } from '#src/http/context.js';
import { toHttpRequest } from '#src/http/adapters/fastify/toHttpRequest.js';
import { toHttpResponse } from '#src/http/adapters/fastify/toHttpResponse.js';
import { diScopeOf } from '#src/http/adapters/fastify/diScope.js';
import { AUTH_HEADER, COOKIES } from '#src/constants.js';

/**
 * Fires once the underlying connection closes, for any reason — a normal
 * completed response closes it too. Only a close *before* the response
 * finished writing means the client actually went away mid-request, so
 * `abortSignal` (JEF-240) only aborts on that case; a request that already
 * finished normally leaves it untouched (the controller is simply never
 * aborted, which is harmless — nothing reads the signal after the resolver
 * has already returned).
 */
export function abortSignalFor(reply: FastifyReply): AbortSignal {
  const controller = new AbortController();
  reply.raw.once('close', () => {
    if (!reply.raw.writableEnded) controller.abort();
  });
  return controller.signal;
}

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
    abortSignal: abortSignalFor(reply),
  };
}
