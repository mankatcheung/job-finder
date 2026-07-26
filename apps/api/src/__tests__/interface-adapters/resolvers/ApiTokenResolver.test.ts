import { describe, it, expect, vi } from 'vitest';
import { ApiTokenResolver } from '#src/interface-adapters/resolvers/ApiTokenResolver.js';
import { ApiTokenMapper } from '#src/interface-adapters/mappers/ApiTokenMapper.js';
import type { CreateApiTokenUseCase } from '#src/use-cases/apiTokens/CreateApiTokenUseCase.js';
import type { DeleteApiTokenUseCase } from '#src/use-cases/apiTokens/DeleteApiTokenUseCase.js';
import type { ListApiTokensUseCase } from '#src/use-cases/apiTokens/ListApiTokensUseCase.js';
import type { ApiToken } from '#src/domain/apiToken/ApiToken.js';

const stub = <T>(methods: Partial<T>): T => methods as T;

const makeToken = (overrides?: Partial<ApiToken>): ApiToken => ({
  id: 'token-1',
  userId: 'user-1',
  name: 'CI token',
  tokenHash: 'hash',
  scope: 'full',
  lastUsedAt: null,
  createdAt: new Date('2024-01-01T00:00:00.000Z'),
  ...overrides,
});

const makeDeps = (overrides?: object) => ({
  createApiTokenUseCase: stub<CreateApiTokenUseCase>({ execute: vi.fn() }),
  deleteApiTokenUseCase: stub<DeleteApiTokenUseCase>({ execute: vi.fn() }),
  listApiTokensUseCase: stub<ListApiTokensUseCase>({ execute: vi.fn() }),
  apiTokenMapper: new ApiTokenMapper(),
  ...overrides,
});

describe('ApiTokenResolver', () => {
  it('createApiToken: creates a token and returns the raw token alongside the mapped fields', async () => {
    const token = makeToken({ scope: 'read' });
    const deps = makeDeps({
      createApiTokenUseCase: stub<CreateApiTokenUseCase>({
        execute: vi.fn().mockResolvedValue({ token, rawToken: 'jfat_rawvalue' }),
      }),
    });

    const resolver = new ApiTokenResolver(deps);
    const result = await resolver.createApiToken('user-1', 'CI token', 'read');

    expect(deps.createApiTokenUseCase.execute).toHaveBeenCalledWith({
      userId: 'user-1',
      name: 'CI token',
      scope: 'read',
    });
    expect(result).toEqual({
      id: 'token-1',
      name: 'CI token',
      token: 'jfat_rawvalue',
      scope: 'read',
      createdAt: '2024-01-01T00:00:00.000Z',
    });
  });

  it('deleteApiToken: deletes and returns true', async () => {
    const deps = makeDeps({
      deleteApiTokenUseCase: stub<DeleteApiTokenUseCase>({
        execute: vi.fn().mockResolvedValue(undefined),
      }),
    });

    const resolver = new ApiTokenResolver(deps);
    const result = await resolver.deleteApiToken('user-1', 'token-1');

    expect(deps.deleteApiTokenUseCase.execute).toHaveBeenCalledWith('token-1', 'user-1');
    expect(result).toBe(true);
  });

  it('listApiTokens: returns mapped DTOs for all of the user’s tokens', async () => {
    const tokens = [makeToken({ id: 'token-1' }), makeToken({ id: 'token-2' })];
    const deps = makeDeps({
      listApiTokensUseCase: stub<ListApiTokensUseCase>({
        execute: vi.fn().mockResolvedValue(tokens),
      }),
    });

    const resolver = new ApiTokenResolver(deps);
    const result = await resolver.listApiTokens('user-1');

    expect(deps.listApiTokensUseCase.execute).toHaveBeenCalledWith('user-1');
    expect(result).toHaveLength(2);
    expect(result[0].id).toBe('token-1');
    expect(result[1].id).toBe('token-2');
  });
});
