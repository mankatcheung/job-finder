/**
 * MCP OAuth authorization-server and protected-resource endpoints.
 *
 * The route table only. Parsing, validation and redirect building live in
 * `mcpOAuth.helpers.ts` (JEF-255).
 */

import type { Cradle } from '#src/http/container.js';
import type { IHttpRequest } from '#src/http/ports/IHttpRequest.js';
import { MCP } from '#src/interface-adapters/mcp/constants.js';
import { MCP_OAUTH } from '#src/use-cases/constants.js';
import { MCP_OAUTH_ROUTES } from '#src/http/constants.js';
import type { RouteDefinition } from '#src/http/ports/RouteDefinition.js';
import {
  allowRequest,
  asRecord,
  authenticatedUserId,
  authorizationRequest,
  buildCodeRedirect,
  buildErrorRedirect,
  consentSubject,
  issuerOrigin,
  noStore,
  recordSecurityEvent,
  sameSiteAsWebApp,
  stringValue,
  validateAuthorizationRequest,
} from '#src/http/routes/mcpOAuth.helpers.js';

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
