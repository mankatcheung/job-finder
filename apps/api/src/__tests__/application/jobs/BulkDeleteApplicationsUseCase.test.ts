import { describe, it, expect, vi } from 'vitest';
import { BulkDeleteApplicationsUseCase } from '@/use-cases/jobs/BulkDeleteApplicationsUseCase.js';
import type { IDeleteApplicationUseCase } from '@/use-cases/jobs/IDeleteApplicationUseCase.js';

const stub = <T>(methods: Partial<T>): T => methods as T;

describe('BulkDeleteApplicationsUseCase', () => {
  it('rejects an empty id list', async () => {
    const deleteApplicationUseCase = stub<IDeleteApplicationUseCase>({ execute: vi.fn() });
    const useCase = new BulkDeleteApplicationsUseCase({ deleteApplicationUseCase });

    const err = await useCase.execute({ userId: 'user-1', applicationIds: [] }).catch((e) => e);

    expect((err as { code: string }).code).toBe('VALIDATION');
    expect(deleteApplicationUseCase.execute).not.toHaveBeenCalled();
  });

  it('rejects more ids than the configured max', async () => {
    const deleteApplicationUseCase = stub<IDeleteApplicationUseCase>({ execute: vi.fn() });
    const useCase = new BulkDeleteApplicationsUseCase({ deleteApplicationUseCase });
    const applicationIds = Array.from({ length: 201 }, (_, i) => `app-${i}`);

    const err = await useCase.execute({ userId: 'user-1', applicationIds }).catch((e) => e);

    expect((err as { code: string }).code).toBe('VALIDATION');
    expect(deleteApplicationUseCase.execute).not.toHaveBeenCalled();
  });

  it('calls deleteApplicationUseCase for every id', async () => {
    const deleteApplicationUseCase = stub<IDeleteApplicationUseCase>({
      execute: vi.fn().mockResolvedValue(undefined),
    });
    const useCase = new BulkDeleteApplicationsUseCase({ deleteApplicationUseCase });

    await useCase.execute({ userId: 'user-1', applicationIds: ['app-1', 'app-2', 'app-3'] });

    expect(deleteApplicationUseCase.execute).toHaveBeenCalledTimes(3);
    expect(deleteApplicationUseCase.execute).toHaveBeenCalledWith({
      userId: 'user-1',
      applicationId: 'app-1',
    });
    expect(deleteApplicationUseCase.execute).toHaveBeenCalledWith({
      userId: 'user-1',
      applicationId: 'app-3',
    });
  });

  it('propagates a per-item error (e.g. NOT_FOUND for a stale id)', async () => {
    const deleteApplicationUseCase = stub<IDeleteApplicationUseCase>({
      execute: vi.fn().mockImplementation(({ applicationId }: { applicationId: string }) => {
        if (applicationId === 'app-2') {
          return Promise.reject(Object.assign(new Error('Not found'), { code: 'NOT_FOUND' }));
        }
        return Promise.resolve(undefined);
      }),
    });
    const useCase = new BulkDeleteApplicationsUseCase({ deleteApplicationUseCase });

    const err = await useCase
      .execute({ userId: 'user-1', applicationIds: ['app-1', 'app-2'] })
      .catch((e) => e);

    expect((err as { code: string }).code).toBe('NOT_FOUND');
  });
});
