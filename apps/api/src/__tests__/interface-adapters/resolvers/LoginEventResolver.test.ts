import { describe, it, expect, vi } from 'vitest';
import { LoginEventResolver } from '@/interface-adapters/resolvers/LoginEventResolver.js';
import { LoginEventMapper } from '@/interface-adapters/mappers/LoginEventMapper.js';
import type { IGetLoginHistoryUseCase } from '@/use-cases/loginEvents/IGetLoginHistoryUseCase.js';

const stub = <T>(methods: Partial<T>): T => methods as T;

const makeDeps = (overrides?: object) => ({
  getLoginHistoryUseCase: stub<IGetLoginHistoryUseCase>({ execute: vi.fn() }),
  loginEventMapper: new LoginEventMapper(),
  ...overrides,
});

describe('LoginEventResolver', () => {
  it('delegates to the use case and maps each event to a DTO', async () => {
    const events = [
      {
        id: 'event-1',
        userId: 'user-1',
        ipAddress: '127.0.0.1',
        userAgent: 'Mozilla/5.0',
        createdAt: new Date('2024-01-01T00:00:00.000Z'),
      },
    ];
    const deps = makeDeps({
      getLoginHistoryUseCase: stub<IGetLoginHistoryUseCase>({
        execute: vi.fn().mockResolvedValue(events),
      }),
    });

    const resolver = new LoginEventResolver(deps);
    const result = await resolver.getLoginHistory('user-1');

    expect(deps.getLoginHistoryUseCase.execute).toHaveBeenCalledWith('user-1');
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      id: 'event-1',
      ipAddress: '127.0.0.1',
      userAgent: 'Mozilla/5.0',
      createdAt: '2024-01-01T00:00:00.000Z',
    });
  });

  it('returns an empty array when there is no history', async () => {
    const deps = makeDeps({
      getLoginHistoryUseCase: stub<IGetLoginHistoryUseCase>({
        execute: vi.fn().mockResolvedValue([]),
      }),
    });

    const resolver = new LoginEventResolver(deps);
    const result = await resolver.getLoginHistory('user-1');

    expect(result).toEqual([]);
  });
});
