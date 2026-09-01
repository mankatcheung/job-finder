import type { IHttpRequest } from '#src/http/ports/IHttpRequest.js';
import type { RouteDefinition } from '#src/http/ports/RouteDefinition.js';
import type { Cradle } from '#src/http/container.js';
import type { IHttpResponse } from '#src/http/ports/IHttpResponse.js';
import type { SecurityEventType } from '#src/domain/securityEvent/SecurityEvent.js';
import type { McpConsentSubject } from '#src/infrastructure/auth/McpOAuthConsentService.js';
import type { McpOAuthScope } from '#src/domain/mcpOAuth/McpOAuthAccessToken.js';
import { MCP_OAUTH } from '#src/use-cases/constants.js';
import { MCP } from '#src/interface-adapters/mcp/constants.js';
import { ENV } from '#src/infrastructure/config/constants.js';
import { COOKIES, MCP_OAUTH_ROUTES } from '#src/http/constants.js';

/**
 * The issuer this authorization server advertises.
 *
 * Deliberately not derived from the request's Host header: discovery metadata
 * names the endpoints a client will send credentials to, so letting a caller
 * choose the host means letting it point clients elsewhere. Falls back to the
 * request origin only when unconfigured, which is the local-dev case.
 */
function issuerOrigin(request: IHttpRequest): string {
  const configured = process.env[ENV.API_ORIGIN]?.trim();
  if (configured) return configured.replace(/\/+$/, '');
  const host = request.headers.host;
  const normalizedHost = Array.isArray(host) ? host[0] : host;
  return `${request.protocol}://${normalizedHost ?? 'localhost:3001'}`;
}

export function mcpOAuthMetadataRoutes(_getCradle: () => Cradle): RouteDefinition[] {
  return [
    {
      method: 'GET',
      path: MCP_OAUTH_ROUTES.PROTECTED_RESOURCE_METADATA,
      handler: (req, res) => {
        const origin = issuerOrigin(req);
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
      path: MCP_OAUTH_ROUTES.AUTHORIZATION_SERVER_METADATA,
      handler: (req, res) => {
        const origin = issuerOrigin(req);
        res.send({
          issuer: origin,
          authorization_endpoint: `${origin}${MCP_OAUTH_ROUTES.AUTHORIZE}`,
          token_endpoint: `${origin}${MCP_OAUTH_ROUTES.TOKEN}`,
          revocation_endpoint: `${origin}${MCP_OAUTH_ROUTES.REVOKE}`,
          registration_endpoint: `${origin}${MCP_OAUTH_ROUTES.REGISTER}`,
          response_types_supported: ['code'],
          grant_types_supported: ['authorization_code', 'refresh_token'],
          code_challenge_methods_supported: ['S256'],
          scopes_supported: [...MCP.SCOPES],
        });
      },
    },
    {
      method: 'POST',
      path: MCP_OAUTH_ROUTES.REGISTER,
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
          noStore(res)
            .status(201)
            .send({
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
      path: MCP_OAUTH_ROUTES.AUTHORIZE,
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
        if (!validation.ok) {
          // Only once the client and its redirect URI are known-good may an
          // error travel back to the client; before that, reporting to an
          // unverified redirect_uri would make this endpoint an open redirect
          // (RFC 6749 s4.1.2.1).
          if (validation.redirectable) {
            res.redirect(buildErrorRedirect(request, validation.error));
            return;
          }
          res.status(400).send({ error: validation.error });
          return;
        }

        // The resolved scope, not what was asked for: the consent screen shows
        // what would actually be granted.
        const query = new URLSearchParams({
          client_id: request.clientId,
          redirect_uri: request.redirectUri,
          response_type: request.responseType,
          scope: validation.scope,
          state: request.state ?? '',
          code_challenge: request.codeChallenge,
          code_challenge_method: request.codeChallengeMethod,
        });
        res.redirect(`${_getCradle().webAppOrigin}/oauth/authorize?${query.toString()}`);
      },
    },
    {
      method: 'GET',
      path: MCP_OAUTH_ROUTES.AUTHORIZE_APPROVE,
      handler: async (req, res) => {
        if (!sameSiteAsWebApp(_getCradle(), req, res)) return;
        if (!(await allowRequest(_getCradle().mcpOAuthAuthorizationRateLimiter, req, res))) return;
        const userId = await authenticatedUserId(_getCradle(), req);
        if (!userId) {
          res.status(401).send({ error: 'login_required' });
          return;
        }

        const request = authorizationRequest(req);
        const validation = await validateAuthorizationRequest(_getCradle(), request);
        if (!validation.ok) {
          res.status(400).send({ error: validation.error });
          return;
        }

        noStore(res).send({
          client_name: validation.client.name,
          scope: validation.scope,
          consent_token: _getCradle().mcpOAuthConsentService.issue(
            consentSubject(userId, request, validation.scope),
          ),
        });
      },
    },
    {
      method: 'POST',
      path: MCP_OAUTH_ROUTES.AUTHORIZE_APPROVE,
      handler: async (req, res) => {
        if (!sameSiteAsWebApp(_getCradle(), req, res)) return;
        if (!(await allowRequest(_getCradle().mcpOAuthAuthorizationRateLimiter, req, res))) return;
        const userId = await authenticatedUserId(_getCradle(), req);
        if (!userId) {
          res.status(401).send({ error: 'login_required' });
          return;
        }

        const body = asRecord(req.body);
        const request = authorizationRequest(body);
        const validation = await validateAuthorizationRequest(_getCradle(), request);
        if (!validation.ok) {
          res.status(400).send({ error: validation.error });
          return;
        }

        // Proof that this decision came from a consent screen this user was
        // shown for this exact request — see McpOAuthConsentService.
        if (
          !_getCradle().mcpOAuthConsentService.verify(
            stringValue(body.consent_token),
            consentSubject(userId, request, validation.scope),
          )
        ) {
          res.status(400).send({ error: 'invalid_request' });
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
            scope: validation.scope,
            codeChallenge: request.codeChallenge,
          });
          await recordSecurityEvent(_getCradle(), userId, 'mcp_oauth_authorized', req);
          noStore(res).send({ redirect_to: buildCodeRedirect(request, result.rawCode) });
        } catch {
          res.status(500).send({ error: 'server_error' });
        }
      },
    },
    {
      method: 'POST',
      path: MCP_OAUTH_ROUTES.TOKEN,
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
          noStore(res).send({
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
        noStore(res).send({
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
      path: MCP_OAUTH_ROUTES.REVOKE,
      handler: async (req, res) => {
        if (!(await allowRequest(_getCradle().mcpOAuthRevocationRateLimiter, req, res))) return;
        const body = asRecord(req.body);
        const userId = await _getCradle().revokeMcpOAuthGrantUseCase.execute(
          stringValue(body.token),
        );
        if (userId) {
          await recordSecurityEvent(_getCradle(), userId, 'mcp_oauth_token_revoked', req);
        }
        // RFC 7009 s2.2: 200 whether or not the token existed, so this cannot
        // be used to probe which credentials are real.
        noStore(res).status(200).send({});
      },
    },
  ];
}

export function protectedResourceMetadataUrl(request: IHttpRequest): string {
  return `${issuerOrigin(request)}${MCP_OAUTH_ROUTES.PROTECTED_RESOURCE_METADATA}`;
}

interface AuthorizationRequest {
  clientId: string;
  redirectUri: string;
  responseType: string;
  /**
   * The effective scope, already resolved from the space-delimited request.
   * Null when the request named something we do not offer.
   */
  scope: McpOAuthScope | null;
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
  return {
    clientId: value('client_id'),
    redirectUri: value('redirect_uri'),
    responseType: value('response_type'),
    scope: resolveScope(value('scope')),
    codeChallenge: value('code_challenge'),
    codeChallengeMethod: value('code_challenge_method'),
    state: value('state') || undefined,
  };
}

/**
 * `scope` is a space-delimited list (RFC 6749 s3.3), not a single value, and a
 * client that reads our `scopes_supported` is entitled to ask for everything
 * in it — `mcp-remote` and Claude's connector both request "read full".
 *
 * Ours are privilege levels rather than independent capabilities, so a request
 * naming both resolves to the higher one: asking for read *and* full is asking
 * for full. The granted scope is what the consent screen displays and what the
 * token response echoes back, so the user sees what they are approving and the
 * client learns what it actually got.
 *
 * Returns null for an empty list or any scope we do not offer, which the
 * caller reports as `invalid_scope`.
 */
function resolveScope(requested: string): McpOAuthScope | null {
  const names = requested.split(/\s+/).filter(Boolean);
  if (names.length === 0) return null;
  if (names.some((name) => name !== 'read' && name !== 'full')) return null;
  return names.includes('full') ? 'full' : 'read';
}

function consentSubject(
  userId: string,
  request: AuthorizationRequest,
  scope: McpOAuthScope,
): McpConsentSubject {
  return {
    userId,
    clientId: request.clientId,
    redirectUri: request.redirectUri,
    scope,
    codeChallenge: request.codeChallenge,
  };
}

/**
 * Either the request is good and carries the client plus the scope actually
 * granted, or it failed. A discriminated result rather than optional fields,
 * so a caller cannot read the scope without having checked for the error.
 */
type AuthorizationValidation =
  | { ok: true; client: { name: string; redirectUris: string[] }; scope: McpOAuthScope }
  | {
      ok: false;
      error: string;
      /** Whether the error may be reported to redirect_uri rather than inline. */
      redirectable?: boolean;
    };

async function validateAuthorizationRequest(
  cradle: Cradle,
  request: AuthorizationRequest,
): Promise<AuthorizationValidation> {
  if (!request.clientId || !request.redirectUri) {
    return { ok: false, error: 'invalid_request' };
  }

  const client = await cradle.mcpOAuthClientRepository.findById(request.clientId);
  if (!client || client.revokedAt || !client.redirectUris.includes(request.redirectUri)) {
    return { ok: false, error: 'invalid_client' };
  }

  // Past this point the redirect target is a URI this client registered, so
  // errors can safely be handed back to it.
  if (request.responseType !== 'code') {
    return { ok: false, error: 'unsupported_response_type', redirectable: true };
  }
  if (!request.codeChallenge || request.codeChallengeMethod !== 'S256') {
    return { ok: false, error: 'invalid_request', redirectable: true };
  }
  if (!request.scope) {
    return { ok: false, error: 'invalid_scope', redirectable: true };
  }
  return { ok: true, client, scope: request.scope };
}

/**
 * The consent endpoints are browser-only and only ever called by the Trakwyn
 * web app, so an exact Origin match is both possible and the load-bearing CSRF
 * defence here. It cannot be left to the global CORS policy: that one also
 * allows every `*.vercel.app` and every `chrome-extension://` origin with
 * credentials, which is fine for the API at large and not fine for an endpoint
 * whose response body carries an authorization code.
 */
function sameSiteAsWebApp(cradle: Cradle, request: IHttpRequest, response: IHttpResponse): boolean {
  const origin = request.headers.origin;
  const normalized = Array.isArray(origin) ? origin[0] : origin;
  if (normalized && normalized === cradle.webAppOrigin) return true;
  response.status(403).send({ error: 'invalid_request' });
  return false;
}

/**
 * The signed-in user, or null. Goes through AuthenticateRequestUseCase rather
 * than verifying the JWT directly so that a session revoked by logout, "sign
 * out other sessions", a password reset, or refresh-token reuse cannot still
 * authorize a client (JEF-164). Without it a 15-minute window on a dead
 * session buys a 30-day refresh token.
 */
async function authenticatedUserId(cradle: Cradle, request: IHttpRequest): Promise<string | null> {
  const accessToken = request.cookies[COOKIES.ACCESS_TOKEN];
  if (!accessToken) return null;
  const result = await cradle.authenticateRequestUseCase.execute(accessToken);
  return result?.sub ?? null;
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

/** RFC 6749 s5.1 — credentials must never be cached. */
function noStore(response: IHttpResponse): IHttpResponse {
  return response.header('Cache-Control', 'no-store').header('Pragma', 'no-cache');
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
