import type { RouteDefinition } from '#src/http/ports/RouteDefinition.js';
import type { Cradle } from '#src/http/container.js';
import { AUTH_HEADER, ROUTES } from '#src/constants.js';
import { protectedResourceMetadataUrl } from './mcpOAuth.routes.js';

/**
 * MCP transport. Authenticates the Bearer API token via
 * AuthenticateMcpRequestUseCase, then hands the JSON-RPC body to the
 * McpController (interface adapter) which owns all protocol logic.
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

        if (!rawToken) {
          res
            .status(401)
            .header(
              'WWW-Authenticate',
              `Bearer resource_metadata="${protectedResourceMetadataUrl(req)}"`,
            )
            .send({ error: 'Missing Authorization header' });
          return;
        }

        const { authenticateMcpRequestUseCase, mcpController } = getCradle();
        const authResult = await authenticateMcpRequestUseCase.execute(rawToken);
        if (!authResult) {
          res
            .status(401)
            .header(
              'WWW-Authenticate',
              `Bearer resource_metadata="${protectedResourceMetadataUrl(req)}"`,
            )
            .send({ error: 'Invalid or expired API token' });
          return;
        }

        const { status, body } = await mcpController.handle(
          req.body,
          authResult.sub,
          authResult.scope,
        );
        res.status(status ?? 200).send(body);
      },
    },
  ];
}
