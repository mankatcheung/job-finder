import { describe, it, expect, vi } from 'vitest';
import { ConfirmDocumentUseCase } from '@/use-cases/documents/ConfirmDocumentUseCase.js';
import {
  makeApplicationRepository,
  makeDocumentRepository,
  makeApplication,
  makeDocument,
} from '@/__tests__/helpers/mocks.js';

describe('ConfirmDocumentUseCase', () => {
  it('throws NOT_FOUND when the application does not exist', async () => {
    const applicationRepository = makeApplicationRepository({
      findById: vi.fn().mockResolvedValue(null),
    });

    const useCase = new ConfirmDocumentUseCase({
      applicationRepository,
      documentRepository: makeDocumentRepository(),
      generateId: vi.fn(),
    });
    const err = await useCase
      .execute({
        userId: 'user-1',
        applicationId: 'app-missing',
        storageKey: 'key',
        name: 'file.pdf',
        mimeType: 'application/pdf',
        sizeBytes: 1000,
      })
      .catch((e) => e);

    expect(err).toBeInstanceOf(Error);
    expect((err as { code: string }).code).toBe('NOT_FOUND');
  });

  it('throws FORBIDDEN when the application belongs to another user', async () => {
    const applicationRepository = makeApplicationRepository({
      findById: vi.fn().mockResolvedValue(makeApplication({ userId: 'other-user' })),
    });

    const useCase = new ConfirmDocumentUseCase({
      applicationRepository,
      documentRepository: makeDocumentRepository(),
      generateId: vi.fn(),
    });
    const err = await useCase
      .execute({
        userId: 'user-1',
        applicationId: 'app-1',
        storageKey: 'key',
        name: 'file.pdf',
        mimeType: 'application/pdf',
        sizeBytes: 1000,
      })
      .catch((e) => e);

    expect(err).toBeInstanceOf(Error);
    expect((err as { code: string }).code).toBe('FORBIDDEN');
  });

  it('creates the document record with all provided fields and generated id', async () => {
    const doc = makeDocument();
    const applicationRepository = makeApplicationRepository({
      findById: vi.fn().mockResolvedValue(makeApplication()),
    });
    const documentRepository = makeDocumentRepository({
      create: vi.fn().mockResolvedValue(doc),
    });
    const generateId = vi.fn().mockReturnValue('doc-1');

    const useCase = new ConfirmDocumentUseCase({
      applicationRepository,
      documentRepository,
      generateId,
    });
    const result = await useCase.execute({
      userId: 'user-1',
      applicationId: 'app-1',
      storageKey: 'users/user-1/applications/app-1/resume.pdf',
      name: 'resume.pdf',
      mimeType: 'application/pdf',
      sizeBytes: 12345,
    });

    expect(result).toEqual(doc);
    expect(documentRepository.create).toHaveBeenCalledWith({
      id: 'doc-1',
      applicationId: 'app-1',
      storageKey: 'users/user-1/applications/app-1/resume.pdf',
      name: 'resume.pdf',
      mimeType: 'application/pdf',
      sizeBytes: 12345,
    });
  });
});
