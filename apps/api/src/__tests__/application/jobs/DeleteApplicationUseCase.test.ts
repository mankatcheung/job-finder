import { describe, it, expect, vi } from 'vitest';
import { DeleteApplicationUseCase } from '@/use-cases/jobs/DeleteApplicationUseCase.js';
import {
  makeApplicationRepository,
  makeDocumentRepository,
  makeStorageProvider,
  makeApplication,
  makeDocument,
} from '@/__tests__/helpers/mocks.js';

describe('DeleteApplicationUseCase', () => {
  it('throws NOT_FOUND when the application does not exist', async () => {
    const applicationRepository = makeApplicationRepository({
      findById: vi.fn().mockResolvedValue(null),
    });
    const documentRepository = makeDocumentRepository();
    const storageProvider = makeStorageProvider();

    const useCase = new DeleteApplicationUseCase({
      applicationRepository,
      documentRepository,
      storageProvider,
    });
    const err = await useCase
      .execute({ userId: 'user-1', applicationId: 'app-missing' })
      .catch((e) => e);

    expect(err).toBeInstanceOf(Error);
    expect((err as { code: string }).code).toBe('NOT_FOUND');
    expect(applicationRepository.delete).not.toHaveBeenCalled();
  });

  it('throws FORBIDDEN when the application belongs to another user', async () => {
    const applicationRepository = makeApplicationRepository({
      findById: vi.fn().mockResolvedValue(makeApplication({ userId: 'other-user' })),
    });

    const useCase = new DeleteApplicationUseCase({
      applicationRepository,
      documentRepository: makeDocumentRepository(),
      storageProvider: makeStorageProvider(),
    });
    const err = await useCase.execute({ userId: 'user-1', applicationId: 'app-1' }).catch((e) => e);

    expect(err).toBeInstanceOf(Error);
    expect((err as { code: string }).code).toBe('FORBIDDEN');
    expect(applicationRepository.delete).not.toHaveBeenCalled();
  });

  it('deletes each document from storage before deleting the application', async () => {
    const docs = [
      makeDocument({ id: 'doc-1', storageKey: 'path/to/resume.pdf' }),
      makeDocument({ id: 'doc-2', storageKey: 'path/to/cover.pdf' }),
    ];
    const applicationRepository = makeApplicationRepository({
      findById: vi.fn().mockResolvedValue(makeApplication()),
      delete: vi.fn().mockResolvedValue(undefined),
    });
    const documentRepository = makeDocumentRepository({
      findAllByApplicationId: vi.fn().mockResolvedValue(docs),
    });
    const storageProvider = makeStorageProvider({
      delete: vi.fn().mockResolvedValue(undefined),
    });

    const useCase = new DeleteApplicationUseCase({
      applicationRepository,
      documentRepository,
      storageProvider,
    });
    await useCase.execute({ userId: 'user-1', applicationId: 'app-1' });

    expect(storageProvider.delete).toHaveBeenCalledTimes(2);
    expect(storageProvider.delete).toHaveBeenCalledWith('path/to/resume.pdf');
    expect(storageProvider.delete).toHaveBeenCalledWith('path/to/cover.pdf');
    expect(applicationRepository.delete).toHaveBeenCalledWith('app-1');
  });

  it('deletes the application even when there are no documents', async () => {
    const applicationRepository = makeApplicationRepository({
      findById: vi.fn().mockResolvedValue(makeApplication()),
      delete: vi.fn().mockResolvedValue(undefined),
    });
    const documentRepository = makeDocumentRepository({
      findAllByApplicationId: vi.fn().mockResolvedValue([]),
    });
    const storageProvider = makeStorageProvider();

    const useCase = new DeleteApplicationUseCase({
      applicationRepository,
      documentRepository,
      storageProvider,
    });
    await useCase.execute({ userId: 'user-1', applicationId: 'app-1' });

    expect(storageProvider.delete).not.toHaveBeenCalled();
    expect(applicationRepository.delete).toHaveBeenCalledWith('app-1');
  });
});
