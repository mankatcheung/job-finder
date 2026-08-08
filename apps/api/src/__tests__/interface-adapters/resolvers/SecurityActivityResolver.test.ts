import { describe, it, expect, vi } from 'vitest';
import { SecurityActivityResolver } from '#src/interface-adapters/resolvers/SecurityActivityResolver.js';
import { SecurityActivityMapper } from '#src/interface-adapters/mappers/SecurityActivityMapper.js';
import type { IGetSecurityActivityUseCase } from '#src/use-cases/securityEvents/IGetSecurityActivityUseCase.js';

const stub = <T>(methods: Partial<T>): T => methods as T;

const makeDeps = (overrides?: object) => ({
  getSecurityActivityUseCase: stub<IGetSecurityActivityUseCase>({ execute: vi.fn() }),
  securityActivityMapper: new SecurityActivityMapper(),
  ...overrides,
});

describe('SecurityActivityResolver', () => {
  it('delegates to the use case and maps each item to a DTO', async () => {
    const items = [
      {
        id: 'event-1',
        eventType: 'password_changed' as const,
        ipAddress: '127.0.0.1',
        userAgent: 'Mozilla/5.0',
        createdAt: new Date('2024-01-01T00:00:00.000Z'),
      },
    ];
    const deps = makeDeps({
      getSecurityActivityUseCase: stub<IGetSecurityActivityUseCase>({
        execute: vi.fn().mockResolvedValue(items),
      }),
    });

    const resolver = new SecurityActivityResolver(deps);
    const result = await resolver.getSecurityActivity('user-1');

    expect(deps.getSecurityActivityUseCase.execute).toHaveBeenCalledWith('user-1');
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      id: 'event-1',
      eventType: 'password_changed',
      ipAddress: '127.0.0.1',
      userAgent: 'Mozilla/5.0',
      createdAt: '2024-01-01T00:00:00.000Z',
    });
  });

  it('returns an empty array when there is no activity', async () => {
    const deps = makeDeps({
      getSecurityActivityUseCase: stub<IGetSecurityActivityUseCase>({
        execute: vi.fn().mockResolvedValue([]),
      }),
    });

    const resolver = new SecurityActivityResolver(deps);
    const result = await resolver.getSecurityActivity('user-1');

    expect(result).toEqual([]);
  });
});
