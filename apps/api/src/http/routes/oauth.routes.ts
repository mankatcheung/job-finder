import type { IHttpRequest } from '#src/http/ports/IHttpRequest.js';
import type { RouteDefinition } from '#src/http/ports/RouteDefinition.js';
import type { Cradle } from '#src/http/container.js';
import { setAuthCookies } from '#src/http/schema/types/AuthPayloadType.js';
import {
  COOKIES,
  COOKIE_PATH,
  ENV,
  ERROR_CODES,
  NODE_ENV,
  OAUTH,
  OAUTH_PROVIDER,
  ROUTES,
} from '#src/constants.js';
import type { OAuthProviderName } from '#src/domain/oauthAccount/OAuthAccount.js';
import { createPkcePair } from '#src/infrastructure/auth/pkce.js';

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
 * Every failure the callback can report, as a closed set of slugs.
 *
 * The route used to forward `err.message` into the query string, so an
 * unexpected throw put internal detail — upstream status codes, provider
 * error slugs, even this deployment's own environment variable names — into
 * the user's URL bar, history and Referer, and onto the sign-in page
 * (JEF-203). Nothing crosses that boundary now except a value from this list,
 * which the client translates.
 */
export const OAUTH_ERROR = {
  /** The user pressed Cancel at the provider. Not a fault. */
  ACCESS_DENIED: 'access_denied',
  MISSING_CODE: 'missing_code',
  INVALID_STATE: 'invalid_state',
  PROVIDER_MISMATCH: 'provider_mismatch',
  MISSING_USER: 'missing_user',
  /** Linking: this provider account already belongs to someone else. */
  ALREADY_LINKED: 'already_linked',
  /** Signing up: the email is taken, and auto-linking would be a takeover vector. */
  EMAIL_IN_USE: 'email_in_use',
  /** Signing up: the provider shared no verified email. */
  EMAIL_NOT_VERIFIED: 'email_not_verified',
  /** Signing in: the link exists but its user does not. */
  ACCOUNT_NOT_FOUND: 'account_not_found',
  /** Anything else. The real error is logged, never shown. */
  FAILED: 'failed',
} as const;

type OAuthErrorSlug = (typeof OAUTH_ERROR)[keyof typeof OAUTH_ERROR];

function codeOf(error: unknown): string | undefined {
  return typeof error === 'object' && error !== null && 'code' in error
    ? String((error as { code: unknown }).code)
    : undefined;
}

/**
 * Maps a thrown error to a slug, by `code` rather than by message — matching
 * on prose would break the moment someone rewords a use case.
 *
 * The same code means different things in the two flows (a CONFLICT while
 * linking is not a CONFLICT while signing up), so the caller says which flow
 * it is in rather than this guessing.
 */
function loginErrorSlug(error: unknown): OAuthErrorSlug {
  switch (codeOf(error)) {
    case ERROR_CODES.CONFLICT:
      return OAUTH_ERROR.EMAIL_IN_USE;
    case ERROR_CODES.VALIDATION:
      return OAUTH_ERROR.EMAIL_NOT_VERIFIED;
    case ERROR_CODES.NOT_FOUND:
      return OAUTH_ERROR.ACCOUNT_NOT_FOUND;
    default:
      return OAUTH_ERROR.FAILED;
  }
}

function linkErrorSlug(error: unknown): OAuthErrorSlug {
  return codeOf(error) === ERROR_CODES.CONFLICT ? OAUTH_ERROR.ALREADY_LINKED : OAUTH_ERROR.FAILED;
}

/**
 * The provider's own `error` param is attacker-influencable text, so it is
 * allow-listed rather than echoed. Only "the user declined" is distinct enough
 * to be worth its own message; every other provider error is a failure the
 * user can do nothing about.
 */
function providerErrorSlug(error: string): OAuthErrorSlug {
  return error === OAUTH_ERROR.ACCESS_DENIED ? OAUTH_ERROR.ACCESS_DENIED : OAUTH_ERROR.FAILED;
}

/**
 * The redirect cookie carries two things the callback needs and the browser
 * must not be able to tamper with: the state's nonce (JEF-198) and the PKCE
 * verifier (JEF-200).
 *
 * One cookie rather than two, deliberately. They are created together, read
 * together and cleared together, and combining them makes it impossible to
 * arrive with one but not the other — a partial state that would otherwise
 * need its own handling on every path. Both halves are base64url or hex, so
 * neither can contain the separator.
 */
const COOKIE_SEPARATOR = '.';

function encodeRedirectCookie(nonce: string, codeVerifier: string): string {
  return `${nonce}${COOKIE_SEPARATOR}${codeVerifier}`;
}

function decodeRedirectCookie(
  request: IHttpRequest,
): { nonce: string; codeVerifier: string } | null {
  const raw = request.cookies[COOKIES.OAUTH_STATE];
  if (typeof raw !== 'string') return null;
  const [nonce, codeVerifier] = raw.split(COOKIE_SEPARATOR);
  if (!nonce || !codeVerifier) return null;
  return { nonce, codeVerifier };
}

/**
 * The signature proves we minted a state; it does not prove we minted it for
 * the browser presenting it. Without this check an attacker can run the flow
 * themselves, keep their own valid code and state, and hand the victim the
 * callback URL — logging the victim into the attacker's account (JEF-198).
 *
 * A missing or half-formed cookie is a hard failure, never a fall-through:
 * treating it as "no cookie, carry on" would leave the hole open while looking
 * closed, and would silently drop PKCE with it.
 */
function stateMatchesBrowser(nonce: string, cookieNonce: string): boolean {
  return cookieNonce.length > 0 && cookieNonce === nonce;
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
        // Only the challenge — the hash — goes to the provider. The verifier
        // stays here, in the cookie, so capturing the redirect URL reveals
        // nothing that could redeem the code.
        const { verifier, challenge } = createPkcePair();
        const authorizationUrl = oauthProviderRegistry
          .get(provider)
          .getAuthorizationUrl(state, callbackUrl(req, provider), challenge);

        // Set on the same response as the redirect, so the browser carries it
        // through the provider and back — see the cookie note above.
        res.setCookie(
          COOKIES.OAUTH_STATE,
          encodeRedirectCookie(nonce, verifier),
          STATE_COOKIE_OPTIONS,
        );
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
          res.redirect(`${webAppOrigin}/login?oauthError=${providerErrorSlug(error)}`);
          return;
        }
        if (!code || !state) {
          res.redirect(`${webAppOrigin}/login?oauthError=${OAUTH_ERROR.MISSING_CODE}`);
          return;
        }

        let parsedState;
        try {
          parsedState = oauthStateService.verify(state);
        } catch {
          res.redirect(`${webAppOrigin}/login?oauthError=${OAUTH_ERROR.INVALID_STATE}`);
          return;
        }
        if (parsedState.provider !== provider) {
          res.redirect(`${webAppOrigin}/login?oauthError=${OAUTH_ERROR.PROVIDER_MISMATCH}`);
          return;
        }
        const redirectCookie = decodeRedirectCookie(req);
        if (!redirectCookie || !stateMatchesBrowser(parsedState.nonce, redirectCookie.nonce)) {
          res.redirect(`${webAppOrigin}/login?oauthError=${OAUTH_ERROR.INVALID_STATE}`);
          return;
        }

        const redirectUri = callbackUrl(req, provider);

        if (parsedState.mode === 'link') {
          // The linked-accounts UI lives at /settings/security, not
          // /account (which just redirects to /settings/profile, dropping
          // this query string) — land there directly so the feedback
          // params below actually get seen.
          if (!parsedState.userId) {
            res.redirect(
              `${webAppOrigin}/settings/security?oauthError=${OAUTH_ERROR.MISSING_USER}`,
            );
            return;
          }
          try {
            const { linkOAuthAccountUseCase } = getCradle();
            await linkOAuthAccountUseCase.execute({
              userId: parsedState.userId,
              provider,
              code,
              redirectUri,
              codeVerifier: redirectCookie.codeVerifier,
            });
            res.redirect(`${webAppOrigin}/settings/security?oauthLinked=${provider}`);
          } catch (err) {
            // Logged, not shown: moving the detail out of the URL must not
            // mean losing it, since this was previously the only place an
            // unexpected failure surfaced at all.
            getCradle().logger.error(`OAuth link failed for ${provider}`, err);
            res.redirect(`${webAppOrigin}/settings/security?oauthError=${linkErrorSlug(err)}`);
          }
          return;
        }

        try {
          const { loginOrSignupWithOAuthUseCase, createSessionUseCase, tokenService } = getCradle();
          const { user } = await loginOrSignupWithOAuthUseCase.execute({
            provider,
            code,
            redirectUri,
            codeVerifier: redirectCookie.codeVerifier,
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
          getCradle().logger.error(`OAuth login failed for ${provider}`, err);
          res.redirect(`${webAppOrigin}/login?oauthError=${loginErrorSlug(err)}`);
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
  // A plain sign-in with no captured destination lands on the dashboard.
  // It used to land on `/`, which only worked because the landing page
  // bounced logged-in visitors to /dashboard — JEF-236 removed that
  // redirect, so the default has to point at a real destination itself.
  return returnTo ? `${webAppOrigin}${returnTo}` : `${webAppOrigin}/dashboard`;
}
