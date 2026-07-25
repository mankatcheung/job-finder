import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GoogleOAuthProvider } from '@/infrastructure/auth/GoogleOAuthProvider.js';

describe('GoogleOAuthProvider', () => {
  beforeEach(() => {
    process.env.GOOGLE_OAUTH_CLIENT_ID = 'client-id';
    process.env.GOOGLE_OAUTH_CLIENT_SECRET = 'client-secret';
  });

  afterEach(() => {
    delete process.env.GOOGLE_OAUTH_CLIENT_ID;
    delete process.env.GOOGLE_OAUTH_CLIENT_SECRET;
    vi.unstubAllGlobals();
  });

  describe('getAuthorizationUrl', () => {
    it('builds a Google authorization URL carrying the client id, redirect, and state', () => {
      const provider = new GoogleOAuthProvider();
      const url = new URL(provider.getAuthorizationUrl('my-state', 'https://api/cb'));

      expect(url.origin + url.pathname).toBe('https://accounts.google.com/o/oauth2/v2/auth');
      expect(url.searchParams.get('client_id')).toBe('client-id');
      expect(url.searchParams.get('redirect_uri')).toBe('https://api/cb');
      expect(url.searchParams.get('state')).toBe('my-state');
      expect(url.searchParams.get('scope')).toContain('email');
    });
  });

  describe('exchangeCodeForProfile', () => {
    it('exchanges the code for a token then fetches and maps the profile', async () => {
      const mockFetch = vi
        .fn()
        .mockResolvedValueOnce({ ok: true, json: async () => ({ access_token: 'tok' }) })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            sub: 'google-sub-1',
            email: 'jeff@example.com',
            email_verified: true,
            name: 'Jeff Man',
          }),
        });
      vi.stubGlobal('fetch', mockFetch);

      const provider = new GoogleOAuthProvider();
      const profile = await provider.exchangeCodeForProfile('auth-code', 'https://api/cb');

      expect(profile).toEqual({
        providerAccountId: 'google-sub-1',
        email: 'jeff@example.com',
        emailVerified: true,
        name: 'Jeff Man',
      });
      expect(mockFetch).toHaveBeenNthCalledWith(
        1,
        'https://oauth2.googleapis.com/token',
        expect.objectContaining({ method: 'POST' }),
      );
    });

    it('throws when the token exchange fails', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 400 }));
      const provider = new GoogleOAuthProvider();

      await expect(provider.exchangeCodeForProfile('bad-code', 'https://api/cb')).rejects.toThrow(
        'Google token exchange failed',
      );
    });

    it('throws when client credentials are not configured', async () => {
      delete process.env.GOOGLE_OAUTH_CLIENT_ID;
      const provider = new GoogleOAuthProvider();

      await expect(provider.exchangeCodeForProfile('code', 'https://api/cb')).rejects.toThrow(
        'not set',
      );
    });
  });
});
