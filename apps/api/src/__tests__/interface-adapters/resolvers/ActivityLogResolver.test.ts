import { describe, it, expect, vi } from 'vitest';
import { ActivityLogResolver } from '#src/interface-adapters/resolvers/ActivityLogResolver.js';
import { ActivityLogMapper } from '#src/interface-adapters/mappers/ActivityLogMapper.js';
import type { IGetActivityLogsUseCase } from '#src/use-cases/activityLogs/IGetActivityLogsUseCase.js';

const stub = <T>(methods: Partial<T>): T => methods as T;

const makeDeps = (overrides?: object) => ({
  getActivityLogsUseCase: stub<IGetActivityLogsUseCase>({ execute: vi.fn() }),
  activityLogMapper: new ActivityLogMapper(),
  ...overrides,
});

describe('ActivityLogResolver', () => {
  it('takes the user id as an argument rather than reaching into a GraphQL context', async () => {
    const deps = makeDeps({
      getActivityLogsUseCase: stub<IGetActivityLogsUseCase>({
        execute: vi.fn().mockResolvedValue([]),
      }),
    });

    // The other twenty resolvers are callable without any GraphQL knowledge;
    // this one used to require a context object, which is what tied an
    // interface adapter to the http layer. Authorization moved to the query,
    // where every other query already does it.
    await new ActivityLogResolver(deps).getActivityLogs('user-1', 'app-1');

    expect(deps.getActivityLogsUseCase.execute).toHaveBeenCalledWith({
      applicationId: 'app-1',
      userId: 'user-1',
    });
  });

  it('maps each log to a DTO', async () => {
    const logs = [
      {
        id: 'log-1',
        applicationId: 'app-1',
        actorId: 'user-1',
        eventType: 'note_added' as const,
        payload: '{}',
        createdAt: new Date('2024-01-01T00:00:00.000Z'),
      },
    ];
    const deps = makeDeps({
      getActivityLogsUseCase: stub<IGetActivityLogsUseCase>({
        execute: vi.fn().mockResolvedValue(logs),
      }),
    });

    const result = await new ActivityLogResolver(deps).getActivityLogs('user-1', 'app-1');

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('log-1');
    expect(result[0].createdAt).toBe('2024-01-01T00:00:00.000Z');
  });
});
