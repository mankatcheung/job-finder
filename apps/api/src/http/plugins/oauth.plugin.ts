import fp from 'fastify-plugin';
import type { FastifyInstance, FastifyRequest } from 'fastify';
import { setAuthCookies } from '@/http/schema/types/AuthPayloadType.js';
import { COOKIES, ENV, OAUTH, OAUTH_PROVIDER, ROUTES } from '@/constants.js';
import type { OAuthProviderName } from '@/domain/oauthAccount/OAuthAccount.js';

const KNOWN_PROVIDERS = new Set<string>(Object.values(OAUTH_PROVIDER));

function isKnownProvider(provider: string): provider is OAuthProviderName {
  return KNOWN_PROVIDERS.has(provider);
}

function callbackUrl(request: FastifyRequest, provider: string): string {
  return `${request.protocol}://${request.headers.host}${OAUTH.callbackPath(provider)}`;
}

export default fp(async function oauthPlugin(fastify: FastifyInstance) {
  fastify.get(ROUTES.OAUTH_START, async (request, reply) => {
    const { provider } = request.params as { provider: string };
    if (!isKnownProvider(provider)) {
      return reply.status(404).send({ error: 'Unknown OAuth provider' });
    }

    const mode = (request.query as { mode?: string }).mode === 'link' ? 'link' : 'login';

    let userId: string | undefined;
    if (mode === 'link') {
      const cookieToken = request.cookies[COOKIES.ACCESS_TOKEN];
      if (!cookieToken) {
        return reply.status(401).send({ error: 'Must be logged in to link a provider' });
      }
      try {
        const payload = fastify.jwt.verify<{ sub: string }>(cookieToken);
        userId = payload.sub;
      } catch {
        return reply.status(401).send({ error: 'Session expired' });
      }
    }

    const { oauthProviderRegistry, oauthStateService } = fastify.diContainer.cradle;
    if (
      !process.env[
        provider === OAUTH_PROVIDER.GOOGLE ? ENV.GOOGLE_OAUTH_CLIENT_ID : ENV.GITHUB_OAUTH_CLIENT_ID
      ]
    ) {
      return reply.status(503).send({ error: `${provider} OAuth is not configured` });
    }

    const state = oauthStateService.issue(provider, mode, userId);
    const authorizationUrl = oauthProviderRegistry
      .get(provider)
      .getAuthorizationUrl(state, callbackUrl(request, provider));

    return reply.redirect(authorizationUrl);
  });

  fastify.get(ROUTES.OAUTH_CALLBACK, async (request, reply) => {
    const { provider } = request.params as { provider: string };
    const { webAppOrigin, oauthStateService } = fastify.diContainer.cradle;
    if (!isKnownProvider(provider)) {
      return reply.status(404).send({ error: 'Unknown OAuth provider' });
    }

    const { code, state, error } = request.query as {
      code?: string;
      state?: string;
      error?: string;
    };
    if (error) {
      return reply.redirect(`${webAppOrigin}/login?oauthError=${encodeURIComponent(error)}`);
    }
    if (!code || !state) {
      return reply.redirect(`${webAppOrigin}/login?oauthError=missing_code`);
    }

    let parsedState;
    try {
      parsedState = oauthStateService.verify(state);
    } catch {
      return reply.redirect(`${webAppOrigin}/login?oauthError=invalid_state`);
    }
    if (parsedState.provider !== provider) {
      return reply.redirect(`${webAppOrigin}/login?oauthError=provider_mismatch`);
    }

    const redirectUri = callbackUrl(request, provider);

    if (parsedState.mode === 'link') {
      if (!parsedState.userId) {
        return reply.redirect(`${webAppOrigin}/account?oauthError=missing_user`);
      }
      try {
        const { linkOAuthAccountUseCase } = fastify.diContainer.cradle;
        await linkOAuthAccountUseCase.execute({
          userId: parsedState.userId,
          provider,
          code,
          redirectUri,
        });
        return reply.redirect(`${webAppOrigin}/account?oauthLinked=${provider}`);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'link_failed';
        return reply.redirect(`${webAppOrigin}/account?oauthError=${encodeURIComponent(message)}`);
      }
    }

    try {
      const { loginOrSignupWithOAuthUseCase, createSessionUseCase, tokenService } =
        fastify.diContainer.cradle;
      const { user } = await loginOrSignupWithOAuthUseCase.execute({ provider, code, redirectUri });
      const session = await createSessionUseCase.execute({
        userId: user.id,
        userAgent: request.headers['user-agent'] ?? null,
        ipAddress: request.ip ?? null,
      });
      const tokens = tokenService.sign(user.id, user.email, session.id);
      setAuthCookies(reply, tokens.accessToken, tokens.refreshToken);
      return reply.redirect(webAppOrigin);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'login_failed';
      return reply.redirect(`${webAppOrigin}/login?oauthError=${encodeURIComponent(message)}`);
    }
  });
});
