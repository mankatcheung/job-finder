import type { IHttpRequest } from '#src/http/ports/IHttpRequest.js';
import type { RouteDefinition } from '#src/http/ports/RouteDefinition.js';
import type { Cradle } from '#src/http/container.js';
import { MCP, MCP_OAUTH } from '#src/constants.js';

function requestOrigin(request: IHttpRequest): string {
  const host = request.headers.host;
  const normalizedHost = Array.isArray(host) ? host[0] : host;
  return `${request.protocol}://${normalizedHost ?? 'localhost:3001'}`;
}

export function mcpOAuthMetadataRoutes(_getCradle: () => Cradle): RouteDefinition[] {
  return [
    {
      method: 'GET',
      path: MCP_OAUTH.PROTECTED_RESOURCE_METADATA,
      handler: (req, res) => {
        const origin = requestOrigin(req);
        res.send({
          resource: `${origin}${MCP_OAUTH.RESOURCE}`,
          authorization_servers: [origin],
          scopes_supported: [...MCP.SCOPES],
          bearer_methods_supported: ['header'],
        });
      },
    },
    {
      method: 'GET',
      path: MCP_OAUTH.AUTHORIZATION_SERVER_METADATA,
      handler: (req, res) => {
        const origin = requestOrigin(req);
        res.send({
          issuer: origin,
          authorization_endpoint: `${origin}${MCP_OAUTH.AUTHORIZE}`,
          token_endpoint: `${origin}${MCP_OAUTH.TOKEN}`,
          revocation_endpoint: `${origin}${MCP_OAUTH.REVOKE}`,
          response_types_supported: ['code'],
          grant_types_supported: ['authorization_code', 'refresh_token'],
          code_challenge_methods_supported: ['S256'],
          scopes_supported: [...MCP.SCOPES],
        });
      },
    },
  ];
}

export function protectedResourceMetadataUrl(request: IHttpRequest): string {
  return `${requestOrigin(request)}${MCP_OAUTH.PROTECTED_RESOURCE_METADATA}`;
}
