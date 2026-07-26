import { describe, it, expect, vi } from 'vitest';
import { createHash } from 'crypto';
import { ValidateApiTokenUseCase } from '#src/use-cases/apiTokens/ValidateApiTokenUseCase.js';
import { makeApiTokenRepository, makeApiToken } from '#src/__tests__/helpers/mocks.js';

describe('ValidateApiTokenUseCase', () => {
  it('returns null when token hash is not found', async () => {
    const repo = makeApiTokenRepository({ findByTokenHash: vi.fn().mockResolvedValue(null) });
    const useCase = new ValidateApiTokenUseCase({ apiTokenRepository: repo });

    const result = await useCase.execute('jfat_unknown');

    expect(result).toBeNull();
    expect(repo.updateLastUsed).not.toHaveBeenCalled();
  });

  it('returns user identity and updates lastUsedAt when token is valid', async () => {
    const rawToken = 'jfat_abc123';
    const expectedHash = createHash('sha256').update(rawToken).digest('hex');
    const token = makeApiToken({ id: 'token-1', userId: 'user-1' });
    const repo = makeApiTokenRepository({
      findByTokenHash: vi
        .fn()
        .mockImplementation(async (hash: string) =>
          hash === expectedHash ? { token, userEmail: 'user@example.com' } : null,
        ),
      updateLastUsed: vi.fn().mockResolvedValue(undefined),
    });
    const useCase = new ValidateApiTokenUseCase({ apiTokenRepository: repo });

    const result = await useCase.execute(rawToken);

    expect(result).toEqual({ sub: 'user-1', email: 'user@example.com', scope: 'full' });
    expect(repo.updateLastUsed).toHaveBeenCalledWith('token-1');
  });
});
