import { describe, expect, it, vi } from 'vitest';
import { RevokeMcpOAuthAccessTokenUseCase } from '#src/use-cases/mcpOAuth/RevokeMcpOAuthAccessTokenUseCase.js';

describe('RevokeMcpOAuthAccessTokenUseCase', () => {
  it('revokes a known MCP OAuth access token without exposing whether it exists', async () => {
    const repository = {
      findByTokenHash: vi.fn().mockResolvedValue({ id: 'token-1' }),
      revoke: vi.fn().mockResolvedValue(undefined),
    };
    const useCase = new RevokeMcpOAuthAccessTokenUseCase({
      mcpOAuthTokenRepository: repository as never,
    });

    await expect(useCase.execute('trakwyn_mcp_token')).resolves.toBeUndefined();
    expect(repository.revoke).toHaveBeenCalledWith('token-1');
  });

  it('does not query storage for another credential type', async () => {
    const repository = { findByTokenHash: vi.fn(), revoke: vi.fn() };
    const useCase = new RevokeMcpOAuthAccessTokenUseCase({
      mcpOAuthTokenRepository: repository as never,
    });

    await useCase.execute('trakwyn_regular_api_token');

    expect(repository.findByTokenHash).not.toHaveBeenCalled();
  });
});
