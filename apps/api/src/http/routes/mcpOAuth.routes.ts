import type { IHttpRequest } from '#src/http/ports/IHttpRequest.js';
import type { RouteDefinition } from '#src/http/ports/RouteDefinition.js';
import type { Cradle } from '#src/http/container.js';
import type { IHttpResponse } from '#src/http/ports/IHttpResponse.js';
import type { SecurityEventType } from '#src/domain/securityEvent/SecurityEvent.js';
import { COOKIES, MCP, MCP_OAUTH } from '#src/constants.js';

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
          registration_endpoint: `${origin}${MCP_OAUTH.REGISTER}`,
          response_types_supported: ['code'],
          grant_types_supported: ['authorization_code', 'refresh_token'],
          code_challenge_methods_supported: ['S256'],
          scopes_supported: [...MCP.SCOPES],
        });
      },
    },
    {
      method: 'POST',
      path: MCP_OAUTH.REGISTER,
      handler: async (req, res) => {
        if (!(await allowRequest(_getCradle().mcpOAuthRegistrationRateLimiter, req, res))) return;
        const body = asRecord(req.body);
        const name = typeof body.client_name === 'string' ? body.client_name : '';
        const redirectUris = Array.isArray(body.redirect_uris)
          ? body.redirect_uris.filter((uri): uri is string => typeof uri === 'string')
          : [];
        try {
          const client = await _getCradle().registerMcpOAuthClientUseCase.execute({
            name,
            redirectUris,
          });
          res.status(201).send({
            client_id: client.id,
            client_name: client.name,
            redirect_uris: client.redirectUris,
            grant_types: ['authorization_code'],
            response_types: ['code'],
            token_endpoint_auth_method: 'none',
          });
        } catch {
          res.status(400).send({ error: 'invalid_client_metadata' });
        }
      },
    },
    {
      method: 'GET',
      path: MCP_OAUTH.AUTHORIZE,
      handler: async (req, res) => {
        const request = authorizationRequest(req);
        if (
          !(await allowRequest(
            _getCradle().mcpOAuthAuthorizationRateLimiter,
            req,
            res,
            request.clientId,
          ))
        )
          return;
        const validation = await validateAuthorizationRequest(_getCradle(), request);
        if (validation.error) {
          res.status(400).send({ error: validation.error });
          return;
        }

        const query = new URLSearchParams({
          client_id: request.clientId,
          redirect_uri: request.redirectUri,
          response_type: request.responseType,
          scope: request.scope,
          state: request.state ?? '',
          code_challenge: request.codeChallenge,
          code_challenge_method: request.codeChallengeMethod,
        });
        res.redirect(`${_getCradle().webAppOrigin}/oauth/authorize?${query.toString()}`);
      },
    },
    {
      method: 'GET',
      path: MCP_OAUTH.AUTHORIZE_APPROVE,
      handler: async (req, res) => {
        if (!(await allowRequest(_getCradle().mcpOAuthAuthorizationRateLimiter, req, res))) return;
        const userId = authenticatedUserId(_getCradle(), req);
        if (!userId) {
          res.status(401).send({ error: 'login_required' });
          return;
        }

        const request = authorizationRequest(req);
        const validation = await validateAuthorizationRequest(_getCradle(), request);
        if (validation.error) {
          res.status(400).send({ error: validation.error });
          return;
        }

        res.send({ client_name: validation.client!.name, scope: request.scope });
      },
    },
    {
      method: 'POST',
      path: MCP_OAUTH.AUTHORIZE_APPROVE,
      handler: async (req, res) => {
        if (!(await allowRequest(_getCradle().mcpOAuthAuthorizationRateLimiter, req, res))) return;
        const userId = authenticatedUserId(_getCradle(), req);
        if (!userId) {
          res.status(401).send({ error: 'login_required' });
          return;
        }

        const body = asRecord(req.body);
        const request = authorizationRequest(body);
        const validation = await validateAuthorizationRequest(_getCradle(), request);
        if (validation.error) {
          res.status(400).send({ error: validation.error });
          return;
        }

        if (body.approved !== true) {
          res.send({ redirect_to: buildErrorRedirect(request, 'access_denied') });
          return;
        }

        try {
          const result = await _getCradle().createMcpOAuthAuthorizationCodeUseCase.execute({
            clientId: request.clientId,
            userId,
            redirectUri: request.redirectUri,
            scope: request.scope,
            codeChallenge: request.codeChallenge,
          });
          await recordSecurityEvent(_getCradle(), userId, 'mcp_oauth_authorized', req);
          res.send({ redirect_to: buildCodeRedirect(request, result.rawCode) });
        } catch {
          res.status(500).send({ error: 'server_error' });
        }
      },
    },
    {
      method: 'POST',
      path: MCP_OAUTH.TOKEN,
      handler: async (req, res) => {
        if (!(await allowRequest(_getCradle().mcpOAuthTokenRateLimiter, req, res))) return;
        const body = asRecord(req.body);
        if (body.grant_type === 'refresh_token') {
          const result = await _getCradle().rotateMcpOAuthRefreshTokenUseCase.execute({
            refreshToken: stringValue(body.refresh_token),
            clientId: stringValue(body.client_id),
          });
          if (!result) {
            res.status(400).send({ error: 'invalid_grant' });
            return;
          }
          await recordSecurityEvent(_getCradle(), result.userId, 'mcp_oauth_token_issued', req);
          res.send({
            access_token: result.accessToken,
            refresh_token: result.refreshToken,
            token_type: 'Bearer',
            expires_in: Math.floor((result.accessTokenExpiresAt.getTime() - Date.now()) / 1000),
          });
          return;
        }

        if (body.grant_type !== 'authorization_code') {
          res.status(400).send({ error: 'unsupported_grant_type' });
          return;
        }

        const result = await _getCradle().exchangeMcpOAuthAuthorizationCodeUseCase.execute({
          code: stringValue(body.code),
          clientId: stringValue(body.client_id),
          redirectUri: stringValue(body.redirect_uri),
          codeVerifier: stringValue(body.code_verifier),
        });
        if (!result) {
          res.status(400).send({ error: 'invalid_grant' });
          return;
        }

        await recordSecurityEvent(_getCradle(), result.token.userId, 'mcp_oauth_token_issued', req);
        res.send({
          access_token: result.accessToken,
          refresh_token: result.refreshToken,
          token_type: 'Bearer',
          expires_in: Math.floor((result.token.expiresAt.getTime() - Date.now()) / 1000),
          scope: result.token.scope,
        });
      },
    },
    {
      method: 'POST',
      path: MCP_OAUTH.REVOKE,
      handler: async (req, res) => {
        if (!(await allowRequest(_getCradle().mcpOAuthRevocationRateLimiter, req, res))) return;
        const body = asRecord(req.body);
        const userId = await _getCradle().revokeMcpOAuthAccessTokenUseCase.execute(
          stringValue(body.token),
        );
        if (userId) {
          await recordSecurityEvent(_getCradle(), userId, 'mcp_oauth_token_revoked', req);
        }
        res.status(200).send({});
      },
    },
  ];
}

export function protectedResourceMetadataUrl(request: IHttpRequest): string {
  return `${requestOrigin(request)}${MCP_OAUTH.PROTECTED_RESOURCE_METADATA}`;
}

interface AuthorizationRequest {
  clientId: string;
  redirectUri: string;
  responseType: string;
  scope: 'read' | 'full';
  codeChallenge: string;
  codeChallengeMethod: string;
  state?: string;
}

function authorizationRequest(input: IHttpRequest | Record<string, unknown>): AuthorizationRequest {
  const value = (key: string): string => {
    if ('query' in input) {
      return stringValue((input as IHttpRequest).query[key]);
    }
    return stringValue(input[key]);
  };
  const scope = value('scope');
  return {
    clientId: value('client_id'),
    redirectUri: value('redirect_uri'),
    responseType: value('response_type'),
    scope: scope as AuthorizationRequest['scope'],
    codeChallenge: value('code_challenge'),
    codeChallengeMethod: value('code_challenge_method'),
    state: value('state') || undefined,
  };
}

async function validateAuthorizationRequest(
  cradle: Cradle,
  request: AuthorizationRequest,
): Promise<{ client?: { name: string; redirectUris: string[] }; error?: string }> {
  if (
    !request.clientId ||
    !request.redirectUri ||
    request.responseType !== 'code' ||
    !request.codeChallenge ||
    request.codeChallengeMethod !== 'S256'
  ) {
    return { error: 'invalid_request' };
  }
  if (request.scope !== 'read' && request.scope !== 'full') {
    return { error: 'invalid_scope' };
  }

  const client = await cradle.mcpOAuthClientRepository.findById(request.clientId);
  if (!client || client.revokedAt || !client.redirectUris.includes(request.redirectUri)) {
    return { error: 'invalid_client' };
  }
  return { client };
}

function authenticatedUserId(cradle: Cradle, request: IHttpRequest): string | null {
  const accessToken = request.cookies[COOKIES.ACCESS_TOKEN];
  if (!accessToken) return null;
  try {
    return cradle.tokenService.verifyAccess(accessToken).sub;
  } catch {
    return null;
  }
}

function buildCodeRedirect(request: AuthorizationRequest, code: string): string {
  const url = new URL(request.redirectUri);
  url.searchParams.set('code', code);
  if (request.state) url.searchParams.set('state', request.state);
  return url.toString();
}

function buildErrorRedirect(request: AuthorizationRequest, error: string): string {
  const url = new URL(request.redirectUri);
  url.searchParams.set('error', error);
  if (request.state) url.searchParams.set('state', request.state);
  return url.toString();
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function stringValue(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

async function allowRequest(
  limiter: Cradle['mcpOAuthTokenRateLimiter'],
  request: IHttpRequest,
  response: IHttpResponse,
  suffix = '',
): Promise<boolean> {
  const key = `mcp-oauth:${request.ip ?? request.headers['user-agent'] ?? 'unknown'}:${suffix}`;
  if (await limiter.consume(key)) return true;
  response.status(429).send({ error: 'rate_limited' });
  return false;
}

async function recordSecurityEvent(
  cradle: Cradle,
  userId: string | undefined,
  eventType: SecurityEventType,
  request: IHttpRequest,
): Promise<void> {
  if (!userId) return;
  await cradle.securityEventRepository.create({
    id: cradle.generateId(),
    userId,
    eventType,
    ipAddress: request.ip,
    userAgent: stringValue(request.headers['user-agent']) || null,
  });
}
