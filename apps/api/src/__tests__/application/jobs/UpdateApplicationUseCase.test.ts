import { describe, it, expect, vi } from 'vitest';
import { UpdateApplicationUseCase } from '@/use-cases/jobs/UpdateApplicationUseCase.js';
import { makeApplicationRepository, makeApplication } from '@/__tests__/helpers/mocks.js';

describe('UpdateApplicationUseCase', () => {
  it('throws NOT_FOUND when the application does not exist', async () => {
    const applicationRepository = makeApplicationRepository({
      findById: vi.fn().mockResolvedValue(null),
    });

    const useCase = new UpdateApplicationUseCase({ applicationRepository });
    const err = await useCase
      .execute({ userId: 'user-1', applicationId: 'app-missing', company: 'Acme' })
      .catch((e) => e);

    expect(err).toBeInstanceOf(Error);
    expect((err as { code: string }).code).toBe('NOT_FOUND');
    expect(applicationRepository.update).not.toHaveBeenCalled();
  });

  it('throws FORBIDDEN when the application belongs to another user', async () => {
    const applicationRepository = makeApplicationRepository({
      findById: vi.fn().mockResolvedValue(makeApplication({ userId: 'other-user' })),
    });

    const useCase = new UpdateApplicationUseCase({ applicationRepository });
    const err = await useCase
      .execute({ userId: 'user-1', applicationId: 'app-1', company: 'Acme' })
      .catch((e) => e);

    expect(err).toBeInstanceOf(Error);
    expect((err as { code: string }).code).toBe('FORBIDDEN');
    expect(applicationRepository.update).not.toHaveBeenCalled();
  });

  it('updates successfully and returns the updated application', async () => {
    const existing = makeApplication();
    const updated = makeApplication({ company: 'New Corp', role: 'Lead Dev' });
    const applicationRepository = makeApplicationRepository({
      findById: vi.fn().mockResolvedValue(existing),
      update: vi.fn().mockResolvedValue(updated),
    });

    const useCase = new UpdateApplicationUseCase({ applicationRepository });
    const result = await useCase.execute({
      userId: 'user-1',
      applicationId: 'app-1',
      company: 'New Corp',
      role: 'Lead Dev',
    });

    expect(result).toEqual(updated);
    expect(applicationRepository.update).toHaveBeenCalledWith(
      'app-1',
      expect.objectContaining({ company: 'New Corp', role: 'Lead Dev' }),
    );
  });

  it('sets appliedAt when status changes to "applied" and appliedAt is null', async () => {
    const existing = makeApplication({ appliedAt: null });
    const applicationRepository = makeApplicationRepository({
      findById: vi.fn().mockResolvedValue(existing),
      update: vi.fn().mockResolvedValue(makeApplication({ status: 'applied' })),
    });

    const useCase = new UpdateApplicationUseCase({ applicationRepository });
    await useCase.execute({ userId: 'user-1', applicationId: 'app-1', status: 'applied' });

    expect(applicationRepository.update).toHaveBeenCalledWith(
      'app-1',
      expect.objectContaining({ status: 'applied', appliedAt: expect.any(Date) }),
    );
  });

  it('does not overwrite appliedAt when it is already set', async () => {
    const existingAppliedAt = new Date('2024-03-01');
    const existing = makeApplication({ appliedAt: existingAppliedAt, status: 'interviewing' });
    const applicationRepository = makeApplicationRepository({
      findById: vi.fn().mockResolvedValue(existing),
      update: vi.fn().mockResolvedValue(makeApplication()),
    });

    const useCase = new UpdateApplicationUseCase({ applicationRepository });
    await useCase.execute({ userId: 'user-1', applicationId: 'app-1', status: 'applied' });

    const updateCall = vi.mocked(applicationRepository.update).mock.calls[0][1];
    expect(updateCall).not.toHaveProperty('appliedAt');
  });

  it('does not set appliedAt for non-"applied" status transitions', async () => {
    const existing = makeApplication({ appliedAt: null });
    const applicationRepository = makeApplicationRepository({
      findById: vi.fn().mockResolvedValue(existing),
      update: vi.fn().mockResolvedValue(makeApplication()),
    });

    const useCase = new UpdateApplicationUseCase({ applicationRepository });
    await useCase.execute({ userId: 'user-1', applicationId: 'app-1', status: 'interviewing' });

    const updateCall = vi.mocked(applicationRepository.update).mock.calls[0][1];
    expect(updateCall).not.toHaveProperty('appliedAt');
  });
});
