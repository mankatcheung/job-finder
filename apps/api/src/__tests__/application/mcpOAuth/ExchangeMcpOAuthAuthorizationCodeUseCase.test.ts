import { createHash } from 'node:crypto';
import { describe, expect, it, vi } from 'vitest';
import { ExchangeMcpOAuthAuthorizationCodeUseCase } from '#src/use-cases/mcpOAuth/ExchangeMcpOAuthAuthorizationCodeUseCase.js';

describe('ExchangeMcpOAuthAuthorizationCodeUseCase', () => {
  const verifier = 'correct-verifier';
  const challenge = createHash('sha256').update(verifier).digest('base64url');
  const now = new Date('2026-08-19T12:00:00.000Z');
  const client = {
    id: 'client-1',
    name: 'MCP Client',
    redirectUris: ['http://localhost:6274/callback'],
    revokedAt: null,
    createdAt: now,
  };
  const code = {
    id: 'code-1',
    codeHash: 'hash',
    clientId: 'client-1',
    userId: 'user-1',
    redirectUri: 'http://localhost:6274/callback',
    scope: 'read' as const,
    codeChallenge: challenge,
    codeChallengeMethod: 'S256' as const,
    expiresAt: new Date('2026-08-19T12:05:00.000Z'),
    consumedAt: null,
    createdAt: now,
  };

  function makeUseCase(overrides: Record<string, unknown> = {}) {
    const authorizationCodeRepository = {
      findByCodeHash: vi.fn().mockResolvedValue(code),
      consume: vi.fn().mockResolvedValue(true),
    } as { findByCodeHash: ReturnType<typeof vi.fn>; consume: ReturnType<typeof vi.fn> };
    const clientRepository = {
      findById: vi.fn().mockResolvedValue(client),
    } as { findById: ReturnType<typeof vi.fn> };
    const createMcpOAuthAccessTokenUseCase = {
      execute: vi.fn().mockResolvedValue({
        rawToken: 'trakwyn_mcp_access',
        token: { id: 'token-1', userId: 'user-1', scope: 'read', expiresAt: code.expiresAt },
      }),
    };
    const createMcpOAuthRefreshTokenUseCase = {
      execute: vi.fn().mockResolvedValue({ rawToken: 'trakwyn_mcp_refresh_token' }),
    };
    return {
      useCase: new ExchangeMcpOAuthAuthorizationCodeUseCase({
        mcpOAuthAuthorizationCodeRepository: authorizationCodeRepository as never,
        mcpOAuthClientRepository: clientRepository as never,
        createMcpOAuthAccessTokenUseCase,
        createMcpOAuthRefreshTokenUseCase,
        now: () => now,
        ...overrides,
      }),
      authorizationCodeRepository,
      clientRepository,
      createMcpOAuthAccessTokenUseCase,
      createMcpOAuthRefreshTokenUseCase,
    };
  }

  it('verifies PKCE and exchanges a valid authorization code once', async () => {
    const deps = makeUseCase();
    const result = await deps.useCase.execute({
      code: 'trakwyn_mcp_code_valid',
      clientId: 'client-1',
      redirectUri: 'http://localhost:6274/callback',
      codeVerifier: verifier,
    });

    expect(result?.accessToken).toBe('trakwyn_mcp_access');
    expect(result?.refreshToken).toBe('trakwyn_mcp_refresh_token');
    expect(deps.authorizationCodeRepository.consume).toHaveBeenCalledWith('code-1', now);
    expect(deps.createMcpOAuthAccessTokenUseCase.execute).toHaveBeenCalledWith({
      userId: 'user-1',
      clientId: 'client-1',
      scope: 'read',
    });
  });

  it.each([
    ['wrong verifier', { codeVerifier: 'wrong' }],
    ['wrong redirect URI', { redirectUri: 'http://localhost:6274/other' }],
    ['wrong client', { clientId: 'client-2' }],
  ])('rejects a %s', async (_reason, input) => {
    const deps = makeUseCase();
    await expect(
      deps.useCase.execute({
        code: 'trakwyn_mcp_code_valid',
        clientId: 'client-1',
        redirectUri: 'http://localhost:6274/callback',
        codeVerifier: verifier,
        ...input,
      }),
    ).resolves.toBeNull();
    expect(deps.createMcpOAuthAccessTokenUseCase.execute).not.toHaveBeenCalled();
  });
});
