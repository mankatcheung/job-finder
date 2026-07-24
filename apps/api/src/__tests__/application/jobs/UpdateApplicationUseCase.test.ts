import { describe, it, expect, vi } from 'vitest';
import { UpdateApplicationUseCase } from '@/use-cases/jobs/UpdateApplicationUseCase.js';
import {
  makeApplicationRepository,
  makeApplication,
  makeTransactionManager,
  makeActivityLogRepository,
} from '@/__tests__/helpers/mocks.js';

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

  it('delegates to transactionManager.run when provided', async () => {
    const existing = makeApplication({ status: 'draft' });
    const updated = makeApplication({ status: 'applied' });
    const applicationRepository = makeApplicationRepository({
      findById: vi.fn().mockResolvedValue(existing),
      update: vi.fn().mockResolvedValue(updated),
    });
    const transactionManager = makeTransactionManager();

    const useCase = new UpdateApplicationUseCase({ applicationRepository, transactionManager });
    await useCase.execute({ userId: 'user-1', applicationId: 'app-1', status: 'applied' });

    expect(transactionManager.run).toHaveBeenCalledOnce();
    expect(applicationRepository.update).toHaveBeenCalled();
  });

  it('runs without a transaction when transactionManager is omitted', async () => {
    const existing = makeApplication();
    const applicationRepository = makeApplicationRepository({
      findById: vi.fn().mockResolvedValue(existing),
      update: vi.fn().mockResolvedValue(makeApplication()),
    });

    const useCase = new UpdateApplicationUseCase({ applicationRepository });
    await expect(
      useCase.execute({ userId: 'user-1', applicationId: 'app-1', company: 'Acme' }),
    ).resolves.toBeDefined();
  });

  it('does not log field_updated when the submitted value equals the current value', async () => {
    const existing = makeApplication({ company: 'Acme' });
    const applicationRepository = makeApplicationRepository({
      findById: vi.fn().mockResolvedValue(existing),
      update: vi.fn().mockResolvedValue(existing),
    });
    const activityLogRepository = makeActivityLogRepository();

    const useCase = new UpdateApplicationUseCase({
      applicationRepository,
      activityLogRepository,
      generateId: () => 'log-1',
    });
    await useCase.execute({ userId: 'user-1', applicationId: 'app-1', company: 'Acme' });

    expect(activityLogRepository.append).not.toHaveBeenCalled();
  });

  it('logs field_updated only for fields that actually changed', async () => {
    const existing = makeApplication({ company: 'Acme', role: 'Engineer' });
    const applicationRepository = makeApplicationRepository({
      findById: vi.fn().mockResolvedValue(existing),
      update: vi.fn().mockResolvedValue(makeApplication({ company: 'Acme', role: 'Staff Eng' })),
    });
    const activityLogRepository = makeActivityLogRepository();

    const useCase = new UpdateApplicationUseCase({
      applicationRepository,
      activityLogRepository,
      generateId: () => 'log-1',
    });
    await useCase.execute({
      userId: 'user-1',
      applicationId: 'app-1',
      company: 'Acme',
      role: 'Staff Eng',
    });

    expect(activityLogRepository.append).toHaveBeenCalledOnce();
    expect(activityLogRepository.append).toHaveBeenCalledWith(
      expect.objectContaining({ payload: JSON.stringify({ fields: ['role'] }) }),
    );
  });

  it('treats an identical followUpAt instant as unchanged even with a new Date object', async () => {
    const existing = makeApplication({ followUpAt: new Date('2026-08-01T00:00:00.000Z') });
    const applicationRepository = makeApplicationRepository({
      findById: vi.fn().mockResolvedValue(existing),
      update: vi.fn().mockResolvedValue(existing),
    });
    const activityLogRepository = makeActivityLogRepository();

    const useCase = new UpdateApplicationUseCase({
      applicationRepository,
      activityLogRepository,
      generateId: () => 'log-1',
    });
    await useCase.execute({
      userId: 'user-1',
      applicationId: 'app-1',
      followUpAt: new Date('2026-08-01T00:00:00.000Z'),
    });

    expect(activityLogRepository.append).not.toHaveBeenCalled();
  });

  it('logs field_updated when followUpAt actually changes', async () => {
    const existing = makeApplication({ followUpAt: new Date('2026-08-01T00:00:00.000Z') });
    const applicationRepository = makeApplicationRepository({
      findById: vi.fn().mockResolvedValue(existing),
      update: vi.fn().mockResolvedValue(existing),
    });
    const activityLogRepository = makeActivityLogRepository();

    const useCase = new UpdateApplicationUseCase({
      applicationRepository,
      activityLogRepository,
      generateId: () => 'log-1',
    });
    await useCase.execute({
      userId: 'user-1',
      applicationId: 'app-1',
      followUpAt: new Date('2026-08-15T00:00:00.000Z'),
    });

    expect(activityLogRepository.append).toHaveBeenCalledWith(
      expect.objectContaining({ payload: JSON.stringify({ fields: ['followUpAt'] }) }),
    );
  });

  it('still logs status_changed as before (regression guard)', async () => {
    const existing = makeApplication({ status: 'draft' });
    const applicationRepository = makeApplicationRepository({
      findById: vi.fn().mockResolvedValue(existing),
      update: vi.fn().mockResolvedValue(makeApplication({ status: 'applied' })),
    });
    const activityLogRepository = makeActivityLogRepository();

    const useCase = new UpdateApplicationUseCase({
      applicationRepository,
      activityLogRepository,
      generateId: () => 'log-1',
    });
    await useCase.execute({ userId: 'user-1', applicationId: 'app-1', status: 'applied' });

    expect(activityLogRepository.append).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: 'status_changed',
        payload: JSON.stringify({ from: 'draft', to: 'applied' }),
      }),
    );
  });
});
