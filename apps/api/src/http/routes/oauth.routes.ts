import type { IHttpRequest } from '#src/http/ports/IHttpRequest.js';
import type { RouteDefinition } from '#src/http/ports/RouteDefinition.js';
import type { Cradle } from '#src/http/container.js';
import { setAuthCookies } from '#src/http/schema/types/AuthPayloadType.js';
import {
  COOKIES,
  COOKIE_PATH,
  ENV,
  NODE_ENV,
  OAUTH,
  OAUTH_PROVIDER,
  ROUTES,
} from '#src/constants.js';
import type { OAuthProviderName } from '#src/domain/oauthAccount/OAuthAccount.js';

const KNOWN_PROVIDERS = new Set<string>(Object.values(OAUTH_PROVIDER));

function isKnownProvider(provider: string): provider is OAuthProviderName {
  return KNOWN_PROVIDERS.has(provider);
}

function callbackUrl(request: IHttpRequest, provider: string): string {
  return `${request.protocol}://${request.headers.host}${OAUTH.callbackPath(provider)}`;
}

/**
 * Options for the cookie that ties a redirect to the browser that began it.
 *
 * `SameSite=Lax`, deliberately not the `none` the auth cookies use: the
 * callback arrives as a top-level GET navigation, which Lax permits, and
 * anything looser would weaken the very thing this cookie exists to prove.
 * Host-only (no `domain`) because only this API ever reads it, and scoped to
 * the same window as the state it guards.
 */
const STATE_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env[ENV.NODE_ENV] === NODE_ENV.PRODUCTION,
  sameSite: 'lax',
  path: COOKIE_PATH,
  maxAge: Math.floor(OAUTH.STATE_TTL_MS / 1000),
} as const;

/**
 * The signature proves we minted a state; it does not prove we minted it for
 * the browser presenting it. Without this check an attacker can run the flow
 * themselves, keep their own valid code and state, and hand the victim the
 * callback URL — logging the victim into the attacker's account (JEF-198).
 *
 * A missing cookie is a hard failure, never a fall-through: treating it as
 * "no cookie, carry on" would leave the hole open while looking closed.
 */
function stateMatchesBrowser(request: IHttpRequest, nonce: string): boolean {
  const cookieNonce = request.cookies[COOKIES.OAUTH_STATE];
  return typeof cookieNonce === 'string' && cookieNonce.length > 0 && cookieNonce === nonce;
}

export function oauthRoutes(getCradle: () => Cradle): RouteDefinition[] {
  return [
    {
      method: 'GET',
      path: ROUTES.OAUTH_START,
      handler: async (req, res) => {
        const { provider } = req.params;
        if (!isKnownProvider(provider)) {
          res.status(404).send({ error: 'Unknown OAuth provider' });
          return;
        }

        const mode = req.query.mode === 'link' ? 'link' : 'login';

        let userId: string | undefined;
        const { tokenService } = getCradle();
        if (mode === 'link') {
          const cookieToken = req.cookies[COOKIES.ACCESS_TOKEN];
          if (!cookieToken) {
            res.status(401).send({ error: 'Must be logged in to link a provider' });
            return;
          }
          try {
            userId = tokenService.verifyAccess(cookieToken).sub;
          } catch {
            res.status(401).send({ error: 'Session expired' });
            return;
          }
        }

        const { oauthProviderRegistry, oauthStateService } = getCradle();
        if (
          !process.env[
            provider === OAUTH_PROVIDER.GOOGLE
              ? ENV.GOOGLE_OAUTH_CLIENT_ID
              : ENV.GITHUB_OAUTH_CLIENT_ID
          ]
        ) {
          res.status(503).send({ error: `${provider} OAuth is not configured` });
          return;
        }

        const returnTo = mode === 'login' ? safeReturnTo(req.query.returnTo) : undefined;
        const { state, nonce } = oauthStateService.issue(provider, mode, userId, returnTo);
        const authorizationUrl = oauthProviderRegistry
          .get(provider)
          .getAuthorizationUrl(state, callbackUrl(req, provider));

        // Set on the same response as the redirect, so the browser carries it
        // through the provider and back — see stateMatchesBrowser above.
        res.setCookie(COOKIES.OAUTH_STATE, nonce, STATE_COOKIE_OPTIONS);
        res.redirect(authorizationUrl);
      },
    },
    {
      method: 'GET',
      path: ROUTES.OAUTH_CALLBACK,
      handler: async (req, res) => {
        const { provider } = req.params;
        const { webAppOrigin, oauthStateService } = getCradle();
        if (!isKnownProvider(provider)) {
          res.status(404).send({ error: 'Unknown OAuth provider' });
          return;
        }

        // Cleared once here rather than on each branch below: this handler has
        // seven ways out, and a stale nonce left behind would block the user's
        // next attempt. The value is read from the request, so clearing the
        // response cookie now does not affect the checks that follow.
        res.clearCookie(COOKIES.OAUTH_STATE, { path: COOKIE_PATH });

        const code = typeof req.query.code === 'string' ? req.query.code : undefined;
        const state = typeof req.query.state === 'string' ? req.query.state : undefined;
        const error = typeof req.query.error === 'string' ? req.query.error : undefined;

        if (error) {
          res.redirect(`${webAppOrigin}/login?oauthError=${encodeURIComponent(error)}`);
          return;
        }
        if (!code || !state) {
          res.redirect(`${webAppOrigin}/login?oauthError=missing_code`);
          return;
        }

        let parsedState;
        try {
          parsedState = oauthStateService.verify(state);
        } catch {
          res.redirect(`${webAppOrigin}/login?oauthError=invalid_state`);
          return;
        }
        if (parsedState.provider !== provider) {
          res.redirect(`${webAppOrigin}/login?oauthError=provider_mismatch`);
          return;
        }
        if (!stateMatchesBrowser(req, parsedState.nonce)) {
          res.redirect(`${webAppOrigin}/login?oauthError=invalid_state`);
          return;
        }

        const redirectUri = callbackUrl(req, provider);

        if (parsedState.mode === 'link') {
          // The linked-accounts UI lives at /settings/security, not
          // /account (which just redirects to /settings/profile, dropping
          // this query string) — land there directly so the feedback
          // params below actually get seen.
          if (!parsedState.userId) {
            res.redirect(`${webAppOrigin}/settings/security?oauthError=missing_user`);
            return;
          }
          try {
            const { linkOAuthAccountUseCase } = getCradle();
            await linkOAuthAccountUseCase.execute({
              userId: parsedState.userId,
              provider,
              code,
              redirectUri,
            });
            res.redirect(`${webAppOrigin}/settings/security?oauthLinked=${provider}`);
          } catch (err) {
            const message = err instanceof Error ? err.message : 'link_failed';
            res.redirect(
              `${webAppOrigin}/settings/security?oauthError=${encodeURIComponent(message)}`,
            );
          }
          return;
        }

        try {
          const { loginOrSignupWithOAuthUseCase, createSessionUseCase, tokenService } = getCradle();
          const { user } = await loginOrSignupWithOAuthUseCase.execute({
            provider,
            code,
            redirectUri,
          });
          const userAgent =
            typeof req.headers['user-agent'] === 'string' ? req.headers['user-agent'] : null;
          const session = await createSessionUseCase.execute({
            userId: user.id,
            userAgent,
            ipAddress: req.ip,
          });
          const tokens = tokenService.sign(
            user.id,
            user.email,
            session.id,
            session.currentRefreshTokenId!,
            Date.now(),
          );
          setAuthCookies(res, tokens.accessToken, tokens.refreshToken);
          res.redirect(returnToUrl(webAppOrigin, parsedState.returnTo));
        } catch (err) {
          const message = err instanceof Error ? err.message : 'login_failed';
          res.redirect(`${webAppOrigin}/login?oauthError=${encodeURIComponent(message)}`);
        }
      },
    },
  ];
}

function safeReturnTo(value: string | string[] | undefined): string | undefined {
  if (typeof value !== 'string' || !value.startsWith('/') || value.startsWith('//'))
    return undefined;
  return value;
}

function returnToUrl(webAppOrigin: string, returnTo: string | undefined): string {
  return returnTo ? `${webAppOrigin}${returnTo}` : webAppOrigin;
}
