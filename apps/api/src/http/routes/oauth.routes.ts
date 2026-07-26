import type { IHttpRequest } from '#src/http/ports/IHttpRequest.js';
import type { RouteDefinition } from '#src/http/ports/RouteDefinition.js';
import type { Cradle } from '#src/http/container.js';
import { setAuthCookies } from '#src/http/schema/types/AuthPayloadType.js';
import { COOKIES, ENV, OAUTH, OAUTH_PROVIDER, ROUTES } from '#src/constants.js';
import type { OAuthProviderName } from '#src/domain/oauthAccount/OAuthAccount.js';

const KNOWN_PROVIDERS = new Set<string>(Object.values(OAUTH_PROVIDER));

function isKnownProvider(provider: string): provider is OAuthProviderName {
  return KNOWN_PROVIDERS.has(provider);
}

function callbackUrl(request: IHttpRequest, provider: string): string {
  return `${request.protocol}://${request.headers.host}${OAUTH.callbackPath(provider)}`;
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

        const state = oauthStateService.issue(provider, mode, userId);
        const authorizationUrl = oauthProviderRegistry
          .get(provider)
          .getAuthorizationUrl(state, callbackUrl(req, provider));

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

        const redirectUri = callbackUrl(req, provider);

        if (parsedState.mode === 'link') {
          if (!parsedState.userId) {
            res.redirect(`${webAppOrigin}/account?oauthError=missing_user`);
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
            res.redirect(`${webAppOrigin}/account?oauthLinked=${provider}`);
          } catch (err) {
            const message = err instanceof Error ? err.message : 'link_failed';
            res.redirect(`${webAppOrigin}/account?oauthError=${encodeURIComponent(message)}`);
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
          const tokens = tokenService.sign(user.id, user.email, session.id);
          setAuthCookies(res, tokens.accessToken, tokens.refreshToken);
          res.redirect(webAppOrigin);
        } catch (err) {
          const message = err instanceof Error ? err.message : 'login_failed';
          res.redirect(`${webAppOrigin}/login?oauthError=${encodeURIComponent(message)}`);
        }
      },
    },
  ];
}
