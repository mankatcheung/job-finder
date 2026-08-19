import { describe, expect, it, vi } from 'vitest';
import { RotateMcpOAuthRefreshTokenUseCase } from '#src/use-cases/mcpOAuth/RotateMcpOAuthRefreshTokenUseCase.js';

describe('RotateMcpOAuthRefreshTokenUseCase', () => {
  const now = new Date('2026-08-19T12:00:00.000Z');
  const baseToken = {
    id: 'refresh-1',
    tokenHash: 'hash',
    familyId: 'family-1',
    clientId: 'client-1',
    userId: 'user-1',
    scope: 'read' as const,
    expiresAt: new Date('2026-09-19T12:00:00.000Z'),
    usedAt: null as Date | null,
    revokedAt: null as Date | null,
    createdAt: now,
  };

  function makeUseCase(token = baseToken) {
    const mcpOAuthRefreshTokenRepository = {
      findByTokenHash: vi.fn().mockResolvedValue(token),
      markUsed: vi.fn().mockResolvedValue(true),
      revokeFamily: vi.fn().mockResolvedValue(undefined),
    };
    const mcpOAuthClientRepository = { findById: vi.fn() };
    const createMcpOAuthAccessTokenUseCase = {
      execute: vi.fn().mockResolvedValue({
        rawToken: 'trakwyn_mcp_access_2',
        token: { expiresAt: new Date('2026-08-19T13:00:00.000Z') },
      }),
    };
    const createMcpOAuthRefreshTokenUseCase = {
      execute: vi.fn().mockResolvedValue({ rawToken: 'trakwyn_mcp_refresh_2' }),
    };
    const securityEventRepository = { create: vi.fn() };
    return {
      useCase: new RotateMcpOAuthRefreshTokenUseCase({
        mcpOAuthRefreshTokenRepository: mcpOAuthRefreshTokenRepository as never,
        mcpOAuthClientRepository: mcpOAuthClientRepository as never,
        createMcpOAuthAccessTokenUseCase,
        createMcpOAuthRefreshTokenUseCase,
        securityEventRepository: securityEventRepository as never,
        generateId: () => 'event-1',
        now: () => now,
      }),
      mcpOAuthRefreshTokenRepository,
      createMcpOAuthAccessTokenUseCase,
      createMcpOAuthRefreshTokenUseCase,
      securityEventRepository,
    };
  }

  it('rotates a valid refresh token and preserves its family', async () => {
    const deps = makeUseCase();
    const result = await deps.useCase.execute({
      refreshToken: 'trakwyn_mcp_refresh_1',
      clientId: 'client-1',
    });

    expect(result).toMatchObject({
      userId: 'user-1',
      accessToken: 'trakwyn_mcp_access_2',
      refreshToken: 'trakwyn_mcp_refresh_2',
    });
    expect(deps.createMcpOAuthRefreshTokenUseCase.execute).toHaveBeenCalledWith({
      userId: 'user-1',
      clientId: 'client-1',
      scope: 'read',
      familyId: 'family-1',
    });
  });

  it('revokes the family and records reuse when a rotated token is presented again', async () => {
    const deps = makeUseCase({ ...baseToken, usedAt: now });

    await expect(
      deps.useCase.execute({ refreshToken: 'trakwyn_mcp_refresh_1', clientId: 'client-1' }),
    ).resolves.toBeNull();
    expect(deps.mcpOAuthRefreshTokenRepository.revokeFamily).toHaveBeenCalledWith('family-1', now);
    expect(deps.securityEventRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-1',
        eventType: 'mcp_oauth_refresh_reuse_detected',
      }),
    );
  });
});
