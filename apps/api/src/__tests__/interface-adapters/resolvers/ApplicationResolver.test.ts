import { describe, it, expect, vi } from 'vitest';
import { ApplicationResolver } from '#src/interface-adapters/resolvers/ApplicationResolver.js';
import { ApplicationMapper } from '#src/interface-adapters/mappers/ApplicationMapper.js';
import { makeApplication } from '#src/__tests__/helpers/mocks.js';
import type { ICreateApplicationUseCase } from '#src/use-cases/jobs/ICreateApplicationUseCase.js';
import type { IGetApplicationsUseCase } from '#src/use-cases/jobs/IGetApplicationsUseCase.js';
import type { IGetApplicationsPageUseCase } from '#src/use-cases/jobs/IGetApplicationsPageUseCase.js';
import type { IGetApplicationUseCase } from '#src/use-cases/jobs/IGetApplicationUseCase.js';
import type { IListTrashedApplicationsUseCase } from '#src/use-cases/jobs/IListTrashedApplicationsUseCase.js';
import type { IRestoreApplicationUseCase } from '#src/use-cases/jobs/IRestoreApplicationUseCase.js';
import type { IPermanentlyDeleteApplicationUseCase } from '#src/use-cases/jobs/IPermanentlyDeleteApplicationUseCase.js';
import type { IBulkRestoreApplicationsUseCase } from '#src/use-cases/jobs/IBulkRestoreApplicationsUseCase.js';
import type { IEmptyTrashUseCase } from '#src/use-cases/jobs/IEmptyTrashUseCase.js';
import type { IUpdateApplicationUseCase } from '#src/use-cases/jobs/IUpdateApplicationUseCase.js';
import type { IDeleteApplicationUseCase } from '#src/use-cases/jobs/IDeleteApplicationUseCase.js';
import type { IBulkUpdateApplicationsUseCase } from '#src/use-cases/jobs/IBulkUpdateApplicationsUseCase.js';
import type { IBulkDeleteApplicationsUseCase } from '#src/use-cases/jobs/IBulkDeleteApplicationsUseCase.js';
import type { IBulkAddTagToApplicationsUseCase } from '#src/use-cases/jobs/IBulkAddTagToApplicationsUseCase.js';

const stub = <T>(methods: Partial<T>): T => methods as T;

const makeDeps = (overrides?: object) => ({
  createApplicationUseCase: stub<ICreateApplicationUseCase>({ execute: vi.fn() }),
  getApplicationsUseCase: stub<IGetApplicationsUseCase>({ execute: vi.fn() }),
  getApplicationsPageUseCase: stub<IGetApplicationsPageUseCase>({ execute: vi.fn() }),
  getApplicationUseCase: stub<IGetApplicationUseCase>({ execute: vi.fn() }),
  updateApplicationUseCase: stub<IUpdateApplicationUseCase>({ execute: vi.fn() }),
  deleteApplicationUseCase: stub<IDeleteApplicationUseCase>({ execute: vi.fn() }),
  bulkUpdateApplicationsUseCase: stub<IBulkUpdateApplicationsUseCase>({ execute: vi.fn() }),
  bulkDeleteApplicationsUseCase: stub<IBulkDeleteApplicationsUseCase>({ execute: vi.fn() }),
  bulkAddTagToApplicationsUseCase: stub<IBulkAddTagToApplicationsUseCase>({ execute: vi.fn() }),
  listTrashedApplicationsUseCase: stub<IListTrashedApplicationsUseCase>({ execute: vi.fn() }),
  restoreApplicationUseCase: stub<IRestoreApplicationUseCase>({ execute: vi.fn() }),
  permanentlyDeleteApplicationUseCase: stub<IPermanentlyDeleteApplicationUseCase>({
    execute: vi.fn(),
  }),
  bulkRestoreApplicationsUseCase: stub<IBulkRestoreApplicationsUseCase>({ execute: vi.fn() }),
  emptyTrashUseCase: stub<IEmptyTrashUseCase>({ execute: vi.fn() }),
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

  it('getApplicationsPage: returns a mapped connection', async () => {
    const apps = [makeApplication({ id: 'app-1' }), makeApplication({ id: 'app-2' })];
    const deps = makeDeps({
      getApplicationsPageUseCase: stub<IGetApplicationsPageUseCase>({
        execute: vi.fn().mockResolvedValue({ items: apps, hasNextPage: true, nextCursor: 'app-2' }),
      }),
    });

    const resolver = new ApplicationResolver(deps);
    const result = await resolver.getApplicationsPage('user-1', {
      status: 'applied',
      search: 'acme',
      cursor: 'app-0',
      limit: 10,
    });

    expect(deps.getApplicationsPageUseCase.execute).toHaveBeenCalledWith({
      userId: 'user-1',
      status: 'applied',
      search: 'acme',
      cursor: 'app-0',
      limit: 10,
    });
    expect(result.items).toHaveLength(2);
    expect(result.items[0].id).toBe('app-1');
    expect(result.hasNextPage).toBe(true);
    expect(result.nextCursor).toBe('app-2');
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
      includeTrashed: true,
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

  it('bulkUpdateApplications: calls the bulk use case and returns mapped DTOs', async () => {
    const apps = [makeApplication({ id: 'app-1' }), makeApplication({ id: 'app-2' })];
    const deps = makeDeps({
      bulkUpdateApplicationsUseCase: stub<IBulkUpdateApplicationsUseCase>({
        execute: vi.fn().mockResolvedValue(apps),
      }),
    });

    const resolver = new ApplicationResolver(deps);
    const result = await resolver.bulkUpdateApplications('user-1', ['app-1', 'app-2'], {
      status: 'interviewing',
    });

    expect(deps.bulkUpdateApplicationsUseCase.execute).toHaveBeenCalledWith({
      userId: 'user-1',
      applicationIds: ['app-1', 'app-2'],
      status: 'interviewing',
    });
    expect(result).toHaveLength(2);
  });

  it('bulkAddTagToApplications: calls the bulk use case and returns mapped DTOs', async () => {
    const apps = [makeApplication({ id: 'app-1', tags: ['urgent'] })];
    const deps = makeDeps({
      bulkAddTagToApplicationsUseCase: stub<IBulkAddTagToApplicationsUseCase>({
        execute: vi.fn().mockResolvedValue(apps),
      }),
    });

    const resolver = new ApplicationResolver(deps);
    const result = await resolver.bulkAddTagToApplications('user-1', ['app-1'], 'urgent');

    expect(deps.bulkAddTagToApplicationsUseCase.execute).toHaveBeenCalledWith({
      userId: 'user-1',
      applicationIds: ['app-1'],
      tag: 'urgent',
    });
    expect(result[0].tags).toEqual(['urgent']);
  });

  it('bulkDeleteApplications: calls the bulk use case and returns true', async () => {
    const deps = makeDeps({
      bulkDeleteApplicationsUseCase: stub<IBulkDeleteApplicationsUseCase>({
        execute: vi.fn().mockResolvedValue(undefined),
      }),
    });

    const resolver = new ApplicationResolver(deps);
    const result = await resolver.bulkDeleteApplications('user-1', ['app-1', 'app-2']);

    expect(deps.bulkDeleteApplicationsUseCase.execute).toHaveBeenCalledWith({
      userId: 'user-1',
      applicationIds: ['app-1', 'app-2'],
    });
    expect(result).toBe(true);
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
  it('bulkRestoreApplications: passes the batch through and returns the count', async () => {
    const deps = makeDeps({
      bulkRestoreApplicationsUseCase: stub<IBulkRestoreApplicationsUseCase>({
        execute: vi.fn().mockResolvedValue({ restored: 2 }),
      }),
    });

    const resolver = new ApplicationResolver(deps);
    const result = await resolver.bulkRestoreApplications('user-1', ['a', 'b']);

    expect(deps.bulkRestoreApplicationsUseCase.execute).toHaveBeenCalledWith({
      userId: 'user-1',
      applicationIds: ['a', 'b'],
    });
    expect(result).toEqual({ restored: 2 });
  });

  it('emptyTrash: returns both counts rather than a bare success', async () => {
    const deps = makeDeps({
      emptyTrashUseCase: stub<IEmptyTrashUseCase>({
        execute: vi.fn().mockResolvedValue({ deleted: 3, failed: 1 }),
      }),
    });

    const resolver = new ApplicationResolver(deps);
    const result = await resolver.emptyTrash('user-1');

    expect(deps.emptyTrashUseCase.execute).toHaveBeenCalledWith({ userId: 'user-1' });
    expect(result).toEqual({ deleted: 3, failed: 1 });
  });
});
