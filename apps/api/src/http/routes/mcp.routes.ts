import type { RouteDefinition } from '#src/http/ports/RouteDefinition.js';
import type { Cradle } from '#src/http/container.js';
import { API_TOKEN, AUTH_HEADER, ROUTES } from '#src/constants.js';

/**
 * MCP transport. Authenticates the Bearer API token, then hands the JSON-RPC
 * body to the McpController (interface adapter) which owns all protocol logic.
 */
export function mcpRoutes(getCradle: () => Cradle): RouteDefinition[] {
  return [
    {
      method: 'POST',
      path: ROUTES.MCP,
      handler: async (req, res) => {
        const authHeader = req.headers.authorization;
        const rawToken =
          typeof authHeader === 'string' && authHeader.startsWith(AUTH_HEADER.BEARER_PREFIX)
            ? authHeader.slice(AUTH_HEADER.BEARER_PREFIX.length)
            : null;

        if (!rawToken?.startsWith(API_TOKEN.PREFIX)) {
          res.status(401).send({ error: 'Missing or invalid Authorization header' });
          return;
        }

        const { validateApiTokenUseCase, mcpController } = getCradle();
        const authResult = await validateApiTokenUseCase.execute(rawToken).catch(() => null);
        if (!authResult) {
          res.status(401).send({ error: 'Invalid or expired API token' });
          return;
        }

        const { status, body } = await mcpController.handle(req.body, authResult.sub);
        res.status(status ?? 200).send(body);
      },
    },
  ];
}
