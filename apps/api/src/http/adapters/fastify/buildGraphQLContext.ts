import type { FastifyRequest, FastifyReply } from 'fastify';
import type { GraphQLContext } from '#src/http/context.js';
import { toHttpRequest } from '#src/http/adapters/fastify/toHttpRequest.js';
import { toHttpResponse } from '#src/http/adapters/fastify/toHttpResponse.js';
import { diScopeOf } from '#src/http/adapters/fastify/diScope.js';
import { authenticateRequest } from '#src/http/auth/authenticateRequest.js';

export async function buildGraphQLContext(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<GraphQLContext> {
  const diScope = diScopeOf(request);
  const user = await authenticateRequest(request, diScope.cradle);

  return {
    user,
    diScope,
    request: toHttpRequest(request),
    reply: toHttpResponse(reply),
  };
}
