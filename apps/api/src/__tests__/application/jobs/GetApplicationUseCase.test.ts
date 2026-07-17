import { describe, it, expect, vi } from 'vitest';
import { GetApplicationUseCase } from '@/use-cases/jobs/GetApplicationUseCase.js';
import { makeApplicationRepository, makeApplication } from '@/__tests__/helpers/mocks.js';

describe('GetApplicationUseCase', () => {
  it('throws NOT_FOUND when the application does not exist', async () => {
    const applicationRepository = makeApplicationRepository({
      findById: vi.fn().mockResolvedValue(null),
    });

    const useCase = new GetApplicationUseCase({ applicationRepository });
    const err = await useCase
      .execute({ userId: 'user-1', applicationId: 'app-missing' })
      .catch((e) => e);

    expect(err).toBeInstanceOf(Error);
    expect((err as { code: string }).code).toBe('NOT_FOUND');
  });

  it('throws FORBIDDEN when the application belongs to another user', async () => {
    const applicationRepository = makeApplicationRepository({
      findById: vi.fn().mockResolvedValue(makeApplication({ userId: 'other-user' })),
    });

    const useCase = new GetApplicationUseCase({ applicationRepository });
    const err = await useCase.execute({ userId: 'user-1', applicationId: 'app-1' }).catch((e) => e);

    expect(err).toBeInstanceOf(Error);
    expect((err as { code: string }).code).toBe('FORBIDDEN');
  });

  it('returns the application when it exists and belongs to the user', async () => {
    const app = makeApplication();
    const applicationRepository = makeApplicationRepository({
      findById: vi.fn().mockResolvedValue(app),
    });

    const useCase = new GetApplicationUseCase({ applicationRepository });
    const result = await useCase.execute({ userId: 'user-1', applicationId: 'app-1' });

    expect(result).toEqual(app);
    expect(applicationRepository.findById).toHaveBeenCalledWith('app-1');
  });
});
