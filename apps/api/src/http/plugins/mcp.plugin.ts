import type { FastifyInstance } from 'fastify';
import { API_TOKEN, AUTH_HEADER, ROUTES } from '@/constants.js';

/**
 * MCP transport. Authenticates the Bearer API token, then hands the JSON-RPC
 * body to the McpController (interface adapter) which owns all protocol logic.
 */
export default async function mcpPlugin(fastify: FastifyInstance) {
  fastify.post(ROUTES.MCP, async (request, reply) => {
    // Authenticate via Bearer API token (both 'full' and 'read' scopes allowed)
    const authHeader = request.headers.authorization;
    const rawToken = authHeader?.startsWith(AUTH_HEADER.BEARER_PREFIX)
      ? authHeader.slice(AUTH_HEADER.BEARER_PREFIX.length)
      : null;

    if (!rawToken?.startsWith(API_TOKEN.PREFIX)) {
      reply.code(401);
      return { error: 'Missing or invalid Authorization header' };
    }

    const { validateApiTokenUseCase, mcpController } = request.diScope.cradle;
    const authResult = await validateApiTokenUseCase.execute(rawToken).catch(() => null);
    if (!authResult) {
      reply.code(401);
      return { error: 'Invalid or expired API token' };
    }

    const { status, body } = await mcpController.handle(request.body, authResult.sub);
    if (status) reply.code(status);
    return body;
  });
}
