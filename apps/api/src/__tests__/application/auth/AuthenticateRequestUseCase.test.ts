import { describe, it, expect, vi } from 'vitest';
import { AuthenticateRequestUseCase } from '#src/use-cases/auth/AuthenticateRequestUseCase.js';
import type { ITokenService } from '#src/use-cases/ports/ITokenService.js';
import type { ValidateApiTokenUseCase } from '#src/use-cases/apiTokens/ValidateApiTokenUseCase.js';

function makeTokenService(overrides?: Partial<ITokenService>): ITokenService {
  return {
    sign: vi.fn(),
    verifyRefresh: vi.fn(),
    verifyAccess: vi.fn(),
    ...overrides,
  };
}

function makeValidateApiTokenUseCase(
  execute?: ValidateApiTokenUseCase['execute'],
): ValidateApiTokenUseCase {
  return {
    execute: execute ?? vi.fn().mockResolvedValue(null),
  } as unknown as ValidateApiTokenUseCase;
}

describe('AuthenticateRequestUseCase', () => {
  it('returns user for a valid JWT', async () => {
    const tokenService = makeTokenService({
      verifyAccess: vi
        .fn()
        .mockReturnValue({ sub: 'user-1', email: 'user@example.com', sid: 'session-1' }),
    });
    const validateApiTokenUseCase = makeValidateApiTokenUseCase();
    const useCase = new AuthenticateRequestUseCase({ tokenService, validateApiTokenUseCase });

    const result = await useCase.execute('valid.jwt.token');

    expect(result).toEqual({ sub: 'user-1', email: 'user@example.com', sid: 'session-1' });
    expect(tokenService.verifyAccess).toHaveBeenCalledWith('valid.jwt.token');
    expect(validateApiTokenUseCase.execute).not.toHaveBeenCalled();
  });

  it('returns null for an expired/invalid JWT', async () => {
    const tokenService = makeTokenService({
      verifyAccess: vi.fn().mockImplementation(() => {
        throw new Error('jwt expired');
      }),
    });
    const validateApiTokenUseCase = makeValidateApiTokenUseCase();
    const useCase = new AuthenticateRequestUseCase({ tokenService, validateApiTokenUseCase });

    const result = await useCase.execute('expired.jwt.token');

    expect(result).toBeNull();
  });

  it('returns user (without sid) for a valid FULL-scope API token', async () => {
    const tokenService = makeTokenService();
    const validateApiTokenUseCase = makeValidateApiTokenUseCase(
      vi.fn().mockResolvedValue({ sub: 'user-1', email: 'user@example.com', scope: 'full' }),
    );
    const useCase = new AuthenticateRequestUseCase({ tokenService, validateApiTokenUseCase });

    const result = await useCase.execute('jfat_abc123');

    expect(result).toEqual({ sub: 'user-1', email: 'user@example.com' });
    expect(validateApiTokenUseCase.execute).toHaveBeenCalledWith('jfat_abc123');
    expect(tokenService.verifyAccess).not.toHaveBeenCalled();
  });

  it('returns null for a valid READ-scope API token (GraphQL requires FULL)', async () => {
    const tokenService = makeTokenService();
    const validateApiTokenUseCase = makeValidateApiTokenUseCase(
      vi.fn().mockResolvedValue({ sub: 'user-1', email: 'user@example.com', scope: 'read' }),
    );
    const useCase = new AuthenticateRequestUseCase({ tokenService, validateApiTokenUseCase });

    const result = await useCase.execute('jfat_readonly');

    expect(result).toBeNull();
  });

  it('returns null when the API token is not found', async () => {
    const tokenService = makeTokenService();
    const validateApiTokenUseCase = makeValidateApiTokenUseCase(vi.fn().mockResolvedValue(null));
    const useCase = new AuthenticateRequestUseCase({ tokenService, validateApiTokenUseCase });

    const result = await useCase.execute('jfat_unknown');

    expect(result).toBeNull();
  });

  it('returns null when API token validation throws', async () => {
    const tokenService = makeTokenService();
    const validateApiTokenUseCase = makeValidateApiTokenUseCase(
      vi.fn().mockRejectedValue(new Error('db error')),
    );
    const useCase = new AuthenticateRequestUseCase({ tokenService, validateApiTokenUseCase });

    const result = await useCase.execute('jfat_broken');

    expect(result).toBeNull();
  });
});
