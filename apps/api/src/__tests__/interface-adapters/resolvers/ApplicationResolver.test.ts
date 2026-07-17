import { describe, it, expect, vi } from 'vitest';
import { ApplicationResolver } from '@/interface-adapters/resolvers/ApplicationResolver.js';
import { ApplicationMapper } from '@/interface-adapters/mappers/ApplicationMapper.js';
import { makeApplication } from '@/__tests__/helpers/mocks.js';
import type { ICreateApplicationUseCase } from '@/use-cases/jobs/ICreateApplicationUseCase.js';
import type { IGetApplicationsUseCase } from '@/use-cases/jobs/IGetApplicationsUseCase.js';
import type { IGetApplicationUseCase } from '@/use-cases/jobs/IGetApplicationUseCase.js';
import type { IUpdateApplicationUseCase } from '@/use-cases/jobs/IUpdateApplicationUseCase.js';
import type { IDeleteApplicationUseCase } from '@/use-cases/jobs/IDeleteApplicationUseCase.js';

const stub = <T>(methods: Partial<T>): T => methods as T;

const makeDeps = (overrides?: object) => ({
  createApplicationUseCase: stub<ICreateApplicationUseCase>({ execute: vi.fn() }),
  getApplicationsUseCase: stub<IGetApplicationsUseCase>({ execute: vi.fn() }),
  getApplicationUseCase: stub<IGetApplicationUseCase>({ execute: vi.fn() }),
  updateApplicationUseCase: stub<IUpdateApplicationUseCase>({ execute: vi.fn() }),
  deleteApplicationUseCase: stub<IDeleteApplicationUseCase>({ execute: vi.fn() }),
  applicationMapper: new ApplicationMapper(),
  ...overrides,
});

describe('ApplicationResolver', () => {
  it('getApplications: returns mapped DTOs for all user applications', async () => {
    const apps = [makeApplication({ id: 'app-1' }), makeApplication({ id: 'app-2' })];
    const deps = makeDeps({
      getApplicationsUseCase: stub<IGetApplicationsUseCase>({
        execute: vi.fn().mockResolvedValue(apps),
      }),
    });

    const resolver = new ApplicationResolver(deps);
    const result = await resolver.getApplications('user-1', 'applied');

    expect(deps.getApplicationsUseCase.execute).toHaveBeenCalledWith({
      userId: 'user-1',
      status: 'applied',
    });
    expect(result).toHaveLength(2);
    expect(result[0].id).toBe('app-1');
    expect(result[1].id).toBe('app-2');
    expect(typeof result[0].createdAt).toBe('string');
  });

  it('getApplication: returns a single mapped DTO', async () => {
    const app = makeApplication();
    const deps = makeDeps({
      getApplicationUseCase: stub<IGetApplicationUseCase>({
        execute: vi.fn().mockResolvedValue(app),
      }),
    });

    const resolver = new ApplicationResolver(deps);
    const result = await resolver.getApplication('user-1', 'app-1');

    expect(deps.getApplicationUseCase.execute).toHaveBeenCalledWith({
      userId: 'user-1',
      applicationId: 'app-1',
    });
    expect(result.id).toBe('app-1');
  });

  it('createApplication: creates and returns the mapped DTO', async () => {
    const app = makeApplication({ company: 'Stripe', role: 'SWE' });
    const deps = makeDeps({
      createApplicationUseCase: stub<ICreateApplicationUseCase>({
        execute: vi.fn().mockResolvedValue(app),
      }),
    });

    const resolver = new ApplicationResolver(deps);
    const result = await resolver.createApplication('user-1', {
      company: 'Stripe',
      role: 'SWE',
    });

    expect(deps.createApplicationUseCase.execute).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'user-1', company: 'Stripe', role: 'SWE' }),
    );
    expect(result.company).toBe('Stripe');
  });

  it('updateApplication: updates and returns the mapped DTO', async () => {
    const app = makeApplication({ role: 'Staff Engineer' });
    const deps = makeDeps({
      updateApplicationUseCase: stub<IUpdateApplicationUseCase>({
        execute: vi.fn().mockResolvedValue(app),
      }),
    });

    const resolver = new ApplicationResolver(deps);
    const result = await resolver.updateApplication('user-1', 'app-1', { role: 'Staff Engineer' });

    expect(deps.updateApplicationUseCase.execute).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'user-1', applicationId: 'app-1', role: 'Staff Engineer' }),
    );
    expect(result.role).toBe('Staff Engineer');
  });

  it('deleteApplication: calls delete use case and returns true', async () => {
    const deps = makeDeps({
      deleteApplicationUseCase: stub<IDeleteApplicationUseCase>({
        execute: vi.fn().mockResolvedValue(undefined),
      }),
    });

    const resolver = new ApplicationResolver(deps);
    const result = await resolver.deleteApplication('user-1', 'app-1');

    expect(deps.deleteApplicationUseCase.execute).toHaveBeenCalledWith({
      userId: 'user-1',
      applicationId: 'app-1',
    });
    expect(result).toBe(true);
  });
});
