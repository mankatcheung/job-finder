import { describe, it, expect, vi } from 'vitest';
import { AuthenticateMcpRequestUseCase } from '#src/use-cases/auth/AuthenticateMcpRequestUseCase.js';
import type { ValidateApiTokenUseCase } from '#src/use-cases/apiTokens/ValidateApiTokenUseCase.js';

function makeValidateApiTokenUseCase(
  execute?: ValidateApiTokenUseCase['execute'],
): ValidateApiTokenUseCase {
  return {
    execute: execute ?? vi.fn().mockResolvedValue(null),
  } as unknown as ValidateApiTokenUseCase;
}

describe('AuthenticateMcpRequestUseCase', () => {
  it('returns user id for a valid FULL-scope API token', async () => {
    const validateApiTokenUseCase = makeValidateApiTokenUseCase(
      vi.fn().mockResolvedValue({ sub: 'user-1', email: 'user@example.com', scope: 'full' }),
    );
    const useCase = new AuthenticateMcpRequestUseCase({ validateApiTokenUseCase });

    const result = await useCase.execute('trakwyn_abc123');

    expect(result).toEqual({ sub: 'user-1' });
    expect(validateApiTokenUseCase.execute).toHaveBeenCalledWith('trakwyn_abc123');
  });

  it('returns user id for a READ-scope API token (MCP accepts any scope)', async () => {
    const validateApiTokenUseCase = makeValidateApiTokenUseCase(
      vi.fn().mockResolvedValue({ sub: 'user-1', email: 'user@example.com', scope: 'read' }),
    );
    const useCase = new AuthenticateMcpRequestUseCase({ validateApiTokenUseCase });

    const result = await useCase.execute('trakwyn_readonly');

    expect(result).toEqual({ sub: 'user-1' });
  });

  it('returns null for a JWT (MCP only accepts API tokens)', async () => {
    const validateApiTokenUseCase = makeValidateApiTokenUseCase();
    const useCase = new AuthenticateMcpRequestUseCase({ validateApiTokenUseCase });

    const result = await useCase.execute('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...');

    expect(result).toBeNull();
    expect(validateApiTokenUseCase.execute).not.toHaveBeenCalled();
  });

  it('returns null when the API token is not found', async () => {
    const validateApiTokenUseCase = makeValidateApiTokenUseCase(vi.fn().mockResolvedValue(null));
    const useCase = new AuthenticateMcpRequestUseCase({ validateApiTokenUseCase });

    const result = await useCase.execute('trakwyn_unknown');

    expect(result).toBeNull();
  });

  it('returns null when validation throws', async () => {
    const validateApiTokenUseCase = makeValidateApiTokenUseCase(
      vi.fn().mockRejectedValue(new Error('db error')),
    );
    const useCase = new AuthenticateMcpRequestUseCase({ validateApiTokenUseCase });

    const result = await useCase.execute('trakwyn_broken');

    expect(result).toBeNull();
  });
});
