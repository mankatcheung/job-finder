import { describe, it, expect, vi } from 'vitest';
import { OAuthResolver } from '#src/interface-adapters/resolvers/OAuthResolver.js';
import { OAuthAccountMapper } from '#src/interface-adapters/mappers/OAuthAccountMapper.js';
import type { IListLinkedOAuthAccountsUseCase } from '#src/use-cases/oauth/IListLinkedOAuthAccountsUseCase.js';
import type { IUnlinkOAuthAccountUseCase } from '#src/use-cases/oauth/IUnlinkOAuthAccountUseCase.js';
import { makeOAuthAccount } from '#src/__tests__/helpers/mocks.js';

const stub = <T>(methods: Partial<T>): T => methods as T;

const makeDeps = (overrides?: object) => ({
  listLinkedOAuthAccountsUseCase: stub<IListLinkedOAuthAccountsUseCase>({
    execute: vi.fn().mockResolvedValue([]),
  }),
  unlinkOAuthAccountUseCase: stub<IUnlinkOAuthAccountUseCase>({
    execute: vi.fn().mockResolvedValue(undefined),
  }),
  oauthAccountMapper: new OAuthAccountMapper(),
  ...overrides,
});

describe('OAuthResolver', () => {
  describe('listLinkedAccounts', () => {
    it('maps each linked account to a DTO', async () => {
      const accounts = [makeOAuthAccount({ provider: 'google' })];
      const deps = makeDeps({
        listLinkedOAuthAccountsUseCase: stub<IListLinkedOAuthAccountsUseCase>({
          execute: vi.fn().mockResolvedValue(accounts),
        }),
      });

      const result = await new OAuthResolver(deps).listLinkedAccounts('user-1');

      expect(deps.listLinkedOAuthAccountsUseCase.execute).toHaveBeenCalledWith('user-1');
      expect(result).toEqual([expect.objectContaining({ provider: 'google' })]);
    });
  });

  describe('unlinkAccount', () => {
    it('delegates to unlinkOAuthAccountUseCase and returns true', async () => {
      const deps = makeDeps();

      const result = await new OAuthResolver(deps).unlinkAccount('user-1', 'github');

      expect(deps.unlinkOAuthAccountUseCase.execute).toHaveBeenCalledWith({
        userId: 'user-1',
        provider: 'github',
      });
      expect(result).toBe(true);
    });
  });
});
