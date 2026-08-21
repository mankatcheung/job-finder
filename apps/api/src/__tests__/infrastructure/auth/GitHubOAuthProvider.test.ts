import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GitHubOAuthProvider } from '#src/infrastructure/auth/GitHubOAuthProvider.js';

describe('GitHubOAuthProvider', () => {
  beforeEach(() => {
    process.env.GITHUB_OAUTH_CLIENT_ID = 'client-id';
    process.env.GITHUB_OAUTH_CLIENT_SECRET = 'client-secret';
  });

  afterEach(() => {
    delete process.env.GITHUB_OAUTH_CLIENT_ID;
    delete process.env.GITHUB_OAUTH_CLIENT_SECRET;
    vi.unstubAllGlobals();
  });

  describe('getAuthorizationUrl', () => {
    it('builds a GitHub authorization URL carrying the client id, redirect, and state', () => {
      const provider = new GitHubOAuthProvider();
      const url = new URL(
        provider.getAuthorizationUrl('my-state', 'https://api/cb', 'my-challenge'),
      );

      expect(url.origin + url.pathname).toBe('https://github.com/login/oauth/authorize');
      expect(url.searchParams.get('client_id')).toBe('client-id');
      expect(url.searchParams.get('redirect_uri')).toBe('https://api/cb');
      expect(url.searchParams.get('state')).toBe('my-state');
    });

    it('sends the PKCE challenge and names S256 as the method', () => {
      // GitHub accepts S256 only (PKCE shipped for OAuth Apps in July 2025).
      const provider = new GitHubOAuthProvider();
      const url = new URL(
        provider.getAuthorizationUrl('my-state', 'https://api/cb', 'my-challenge'),
      );

      expect(url.searchParams.get('code_challenge')).toBe('my-challenge');
      expect(url.searchParams.get('code_challenge_method')).toBe('S256');
    });
  });

  describe('exchangeCodeForProfile', () => {
    it('uses the public email from /user when present', async () => {
      const mockFetch = vi
        .fn()
        .mockResolvedValueOnce({ ok: true, json: async () => ({ access_token: 'tok' }) })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ id: 42, name: 'Jeff Man', email: 'jeff@example.com' }),
        });
      vi.stubGlobal('fetch', mockFetch);

      const provider = new GitHubOAuthProvider();
      const profile = await provider.exchangeCodeForProfile(
        'auth-code',
        'https://api/cb',
        'my-verifier',
      );

      expect(profile).toEqual({
        providerAccountId: '42',
        email: 'jeff@example.com',
        emailVerified: true,
        name: 'Jeff Man',
      });
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('falls back to /user/emails when the primary email is private', async () => {
      const mockFetch = vi
        .fn()
        .mockResolvedValueOnce({ ok: true, json: async () => ({ access_token: 'tok' }) })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ id: 42, name: 'Jeff Man', email: null }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => [
            { email: 'secondary@example.com', primary: false, verified: true },
            { email: 'primary@example.com', primary: true, verified: true },
          ],
        });
      vi.stubGlobal('fetch', mockFetch);

      const provider = new GitHubOAuthProvider();
      const profile = await provider.exchangeCodeForProfile(
        'auth-code',
        'https://api/cb',
        'my-verifier',
      );

      expect(profile.email).toBe('primary@example.com');
      expect(profile.emailVerified).toBe(true);
      expect(mockFetch).toHaveBeenCalledTimes(3);
    });

    it('throws when the token exchange returns no access_token', async () => {
      vi.stubGlobal(
        'fetch',
        vi
          .fn()
          .mockResolvedValue({ ok: true, json: async () => ({ error: 'bad_verification_code' }) }),
      );
      const provider = new GitHubOAuthProvider();

      await expect(
        provider.exchangeCodeForProfile('bad-code', 'https://api/cb', 'my-verifier'),
      ).rejects.toThrow('GitHub token exchange failed');
    });
  });
});
