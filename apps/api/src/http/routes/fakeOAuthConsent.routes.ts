import type { RouteDefinition } from '#src/http/ports/RouteDefinition.js';
import type { IHttpRequest } from '#src/http/ports/IHttpRequest.js';
import { OAUTH_PROVIDER, ROUTES } from '#src/http/constants.js';
import type { OAuthProfile } from '#src/use-cases/ports/IOAuthProvider.js';

/**
 * The "provider" side of `FakeOAuthProvider`: registered only when
 * `OAUTH_PROVIDER_MODE=fake`, so it does not exist as an attack surface in
 * any deployment that does not explicitly opt in (never production).
 *
 * Plays the role a real provider's consent screen plays for `/auth/oauth/*`:
 * it receives the same `state` (and, for a real provider, PKCE challenge —
 * irrelevant here, since this "provider" never exchanges the code over the
 * network), and immediately redirects back to this app's own callback with
 * either a `code` or an `error`, exactly as `oauth.routes.ts` expects from a
 * real one. There is no consent UI to click through: an e2e test drives what
 * would normally be a user's choice via query params instead (`deny=1`,
 * `email=`, `name=`).
 */
export function fakeOAuthConsentRoutes(): RouteDefinition[] {
  return [
    {
      method: 'GET',
      path: ROUTES.OAUTH_FAKE_CONSENT,
      handler: async (req, res) => {
        const provider = req.query.provider;
        const state = req.query.state;
        if (typeof provider !== 'string' || typeof state !== 'string') {
          res.status(400).send({ error: 'Missing provider or state' });
          return;
        }
        if (!Object.values(OAUTH_PROVIDER).includes(provider as never)) {
          res.status(404).send({ error: 'Unknown OAuth provider' });
          return;
        }

        const redirectUri = `${req.protocol}://${req.headers.host}${callbackPath(provider)}`;

        if (req.query.deny === '1') {
          res.redirect(`${redirectUri}?error=access_denied&state=${encodeURIComponent(state)}`);
          return;
        }

        const code = Buffer.from(JSON.stringify(fakeProfile(req, provider)), 'utf8').toString(
          'base64url',
        );
        res.redirect(
          `${redirectUri}?code=${encodeURIComponent(code)}&state=${encodeURIComponent(state)}`,
        );
      },
    },
  ];
}

function callbackPath(provider: string): string {
  return `/auth/oauth/${provider}/callback`;
}

/**
 * Query params let a test pick a specific email/name (e.g. to collide with
 * an existing account and exercise `email_in_use`); otherwise a fresh,
 * unique-enough identity per call so unrelated tests never collide.
 */
function fakeProfile(req: IHttpRequest, provider: string): OAuthProfile {
  const email =
    typeof req.query.email === 'string'
      ? req.query.email
      : `fake-${provider}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@e2e.example.com`;
  const name = typeof req.query.name === 'string' ? req.query.name : `Fake ${provider} user`;
  const emailVerified = req.query.emailVerified !== '0';

  return {
    providerAccountId: `fake-${provider}-${email}`,
    email,
    emailVerified,
    name,
  };
}
