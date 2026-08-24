import { describe, it, expect } from 'vitest';
import {
  FakeGoogleOAuthProvider,
  FakeGitHubOAuthProvider,
} from '#src/infrastructure/auth/FakeOAuthProvider.js';
import { ROUTES } from '#src/constants.js';

describe('FakeOAuthProvider', () => {
  describe('getAuthorizationUrl', () => {
    it('points at the fake consent route, carrying the provider name and state', () => {
      const url = new FakeGoogleOAuthProvider().getAuthorizationUrl(
        'my-state',
        'https://api/cb',
        'my-challenge',
      );
      const parsed = new URL(url, 'http://localhost');

      expect(parsed.pathname).toBe(ROUTES.OAUTH_FAKE_CONSENT);
      expect(parsed.searchParams.get('provider')).toBe('google');
      expect(parsed.searchParams.get('state')).toBe('my-state');
    });

    it('names the right provider for GitHub', () => {
      const url = new URL(
        new FakeGitHubOAuthProvider().getAuthorizationUrl('s', 'https://api/cb', 'c'),
        'http://localhost',
      );
      expect(url.searchParams.get('provider')).toBe('github');
    });
  });

  describe('exchangeCodeForProfile', () => {
    it('decodes the profile the consent route encoded into the code, without any network call', async () => {
      const profile = {
        providerAccountId: 'fake-google-jeff@example.com',
        email: 'jeff@example.com',
        emailVerified: true,
        name: 'Jeff Man',
      };
      const code = Buffer.from(JSON.stringify(profile), 'utf8').toString('base64url');

      const result = await new FakeGoogleOAuthProvider().exchangeCodeForProfile(
        code,
        'https://api/cb',
        'verifier-unused-by-the-fake',
      );

      expect(result).toEqual(profile);
    });
  });
});
