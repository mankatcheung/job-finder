import { describe, it, expect, vi } from 'vitest';
import { NotificationResolver } from '#src/interface-adapters/resolvers/NotificationResolver.js';
import { NotificationMapper } from '#src/interface-adapters/mappers/NotificationMapper.js';
import type { IGetNotificationsPageUseCase } from '#src/use-cases/notifications/IGetNotificationsPageUseCase.js';
import type { IMarkNotificationsReadUseCase } from '#src/use-cases/notifications/IMarkNotificationsReadUseCase.js';
import type { IGetUnreadNotificationCountUseCase } from '#src/use-cases/notifications/IGetUnreadNotificationCountUseCase.js';
import { makeNotification } from '#src/__tests__/helpers/mocks.js';

const stub = <T>(methods: Partial<T>): T => methods as T;

const makeDeps = (overrides?: object) => ({
  getNotificationsPageUseCase: stub<IGetNotificationsPageUseCase>({ execute: vi.fn() }),
  markNotificationsReadUseCase: stub<IMarkNotificationsReadUseCase>({ execute: vi.fn() }),
  getUnreadNotificationCountUseCase: stub<IGetUnreadNotificationCountUseCase>({ execute: vi.fn() }),
  notificationMapper: new NotificationMapper(),
  ...overrides,
});

describe('NotificationResolver', () => {
  it('getNotificationsPage: maps items and passes through pagination fields', async () => {
    const items = [makeNotification({ id: 'n-1' }), makeNotification({ id: 'n-2' })];
    const deps = makeDeps({
      getNotificationsPageUseCase: stub<IGetNotificationsPageUseCase>({
        execute: vi.fn().mockResolvedValue({ items, nextCursor: 'n-2', hasNextPage: true }),
      }),
    });

    const resolver = new NotificationResolver(deps);
    const result = await resolver.getNotificationsPage('user-1', { cursor: 'n-0', limit: 2 });

    expect(deps.getNotificationsPageUseCase.execute).toHaveBeenCalledWith({
      userId: 'user-1',
      cursor: 'n-0',
      limit: 2,
    });
    expect(result.items).toHaveLength(2);
    expect(result.items[0].id).toBe('n-1');
    expect(result.nextCursor).toBe('n-2');
    expect(result.hasNextPage).toBe(true);
  });

  it('getUnreadNotificationCount: delegates to the use case', async () => {
    const deps = makeDeps({
      getUnreadNotificationCountUseCase: stub<IGetUnreadNotificationCountUseCase>({
        execute: vi.fn().mockResolvedValue(4),
      }),
    });

    const resolver = new NotificationResolver(deps);
    const result = await resolver.getUnreadNotificationCount('user-1');

    expect(deps.getUnreadNotificationCountUseCase.execute).toHaveBeenCalledWith('user-1');
    expect(result).toBe(4);
  });

  it('markNotificationsRead: delegates to the use case and returns true', async () => {
    const deps = makeDeps({
      markNotificationsReadUseCase: stub<IMarkNotificationsReadUseCase>({
        execute: vi.fn().mockResolvedValue(undefined),
      }),
    });

    const resolver = new NotificationResolver(deps);
    const result = await resolver.markNotificationsRead('user-1', ['n-1', 'n-2'], true);

    expect(deps.markNotificationsReadUseCase.execute).toHaveBeenCalledWith({
      userId: 'user-1',
      ids: ['n-1', 'n-2'],
      isRead: true,
    });
    expect(result).toBe(true);
  });
});
