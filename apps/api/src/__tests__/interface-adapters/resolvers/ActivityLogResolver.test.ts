import { describe, it, expect, vi } from 'vitest';
import { ActivityLogResolver } from '#src/interface-adapters/resolvers/ActivityLogResolver.js';
import { ActivityLogMapper } from '#src/interface-adapters/mappers/ActivityLogMapper.js';
import type { IGetActivityLogsUseCase } from '#src/use-cases/activityLogs/IGetActivityLogsUseCase.js';
import type { GraphQLContext } from '#src/http/context.js';

const stub = <T>(methods: Partial<T>): T => methods as T;

const makeCtx = (user: GraphQLContext['user']): GraphQLContext =>
  ({ user }) as unknown as GraphQLContext;

const makeDeps = (overrides?: object) => ({
  getActivityLogsUseCase: stub<IGetActivityLogsUseCase>({ execute: vi.fn() }),
  activityLogMapper: new ActivityLogMapper(),
  ...overrides,
});

describe('ActivityLogResolver', () => {
  it('throws UNAUTHORIZED when the context has no authenticated user', async () => {
    const resolver = new ActivityLogResolver(makeDeps());
    const err = await resolver.getActivityLogs('app-1', makeCtx(null)).catch((e) => e);

    expect(err).toBeInstanceOf(Error);
    expect((err as { code: string }).code).toBe('UNAUTHORIZED');
  });

  it('delegates to the use case with the authenticated user id and maps each log to a DTO', async () => {
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

    const resolver = new ActivityLogResolver(deps);
    const result = await resolver.getActivityLogs(
      'app-1',
      makeCtx({ sub: 'user-1', email: 'user@example.com' }),
    );

    expect(deps.getActivityLogsUseCase.execute).toHaveBeenCalledWith({
      applicationId: 'app-1',
      userId: 'user-1',
    });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('log-1');
    expect(result[0].createdAt).toBe('2024-01-01T00:00:00.000Z');
  });
});
