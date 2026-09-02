import { describe, it, expect, vi } from 'vitest';
import { CreateApplicationUseCase } from '#src/use-cases/jobs/CreateApplicationUseCase.js';
import { makeApplication, makeApplicationRepository } from '#src/__tests__/helpers/mocks/jobs.js';

describe('CreateApplicationUseCase', () => {
  it('creates an application with all provided fields', async () => {
    const created = makeApplication({ company: 'Google', role: 'SWE', status: 'applied' });
    const applicationRepository = makeApplicationRepository({
      create: vi.fn().mockResolvedValue(created),
    });
    const generateId = vi.fn().mockReturnValue('app-1');

    const useCase = new CreateApplicationUseCase({ applicationRepository, generateId });
    const result = await useCase.execute({
      userId: 'user-1',
      company: 'Google',
      role: 'SWE',
      status: 'applied',
      jobUrl: 'https://google.com/jobs/1',
      location: 'Remote',
    });

    expect(result).toEqual(created);
    expect(applicationRepository.create).toHaveBeenCalledWith({
      id: 'app-1',
      userId: 'user-1',
      company: 'Google',
      role: 'SWE',
      status: 'applied',
      jobUrl: 'https://google.com/jobs/1',
      location: 'Remote',
      salaryRange: null,
      description: null,
      starred: false,
      source: null,
      followUpAt: null,
      tags: [],
    });
    expect(generateId).toHaveBeenCalled();
  });

  it('defaults status to "draft" when not provided', async () => {
    const applicationRepository = makeApplicationRepository({
      create: vi.fn().mockResolvedValue(makeApplication()),
    });
    const generateId = vi.fn().mockReturnValue('app-1');

    const useCase = new CreateApplicationUseCase({ applicationRepository, generateId });
    await useCase.execute({ userId: 'user-1', company: 'Acme', role: 'Dev' });

    expect(applicationRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'draft' }),
    );
  });

  it('coerces undefined optional fields to null', async () => {
    const applicationRepository = makeApplicationRepository({
      create: vi.fn().mockResolvedValue(makeApplication()),
    });

    const useCase = new CreateApplicationUseCase({
      applicationRepository,
      generateId: vi.fn().mockReturnValue('app-1'),
    });
    await useCase.execute({ userId: 'user-1', company: 'Acme', role: 'Dev' });

    expect(applicationRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        jobUrl: null,
        location: null,
        salaryRange: null,
        description: null,
      }),
    );
  });

  it('uses the generateId function for the application id and tag ids', async () => {
    const applicationRepository = makeApplicationRepository({
      create: vi.fn().mockResolvedValue(makeApplication()),
    });
    const generateId = vi.fn().mockReturnValue('generated-id');

    const useCase = new CreateApplicationUseCase({ applicationRepository, generateId });
    await useCase.execute({
      userId: 'user-1',
      company: 'Acme',
      role: 'Dev',
      tags: ['remote', 'senior'],
    });

    expect(generateId).toHaveBeenCalledTimes(3);
    expect(applicationRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'generated-id',
        tags: [
          { id: 'generated-id', name: 'remote' },
          { id: 'generated-id', name: 'senior' },
        ],
      }),
    );
  });
});
