import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RequestUploadUrlUseCase } from '#src/use-cases/documents/RequestUploadUrlUseCase.js';
import {
  makeApplicationRepository,
  makeStorageProvider,
  makeApplication,
} from '#src/__tests__/helpers/mocks.js';

vi.mock('nanoid', () => ({ nanoid: vi.fn().mockReturnValue('fixed-nanoid') }));

describe('RequestUploadUrlUseCase', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('throws NOT_FOUND when the application does not exist', async () => {
    const applicationRepository = makeApplicationRepository({
      findById: vi.fn().mockResolvedValue(null),
    });

    const useCase = new RequestUploadUrlUseCase({
      applicationRepository,
      storageProvider: makeStorageProvider(),
    });
    const err = await useCase
      .execute({
        userId: 'user-1',
        applicationId: 'app-missing',
        filename: 'resume.pdf',
        mimeType: 'application/pdf',
      })
      .catch((e) => e);

    expect(err).toBeInstanceOf(Error);
    expect((err as { code: string }).code).toBe('NOT_FOUND');
  });

  it('throws FORBIDDEN when the application belongs to another user', async () => {
    const applicationRepository = makeApplicationRepository({
      findById: vi.fn().mockResolvedValue(makeApplication({ userId: 'other-user' })),
    });

    const useCase = new RequestUploadUrlUseCase({
      applicationRepository,
      storageProvider: makeStorageProvider(),
    });
    const err = await useCase
      .execute({
        userId: 'user-1',
        applicationId: 'app-1',
        filename: 'resume.pdf',
        mimeType: 'application/pdf',
      })
      .catch((e) => e);

    expect(err).toBeInstanceOf(Error);
    expect((err as { code: string }).code).toBe('FORBIDDEN');
  });

  it('returns a presigned upload URL and the computed storage key', async () => {
    const applicationRepository = makeApplicationRepository({
      findById: vi.fn().mockResolvedValue(makeApplication()),
    });
    const storageProvider = makeStorageProvider({
      getPresignedUploadUrl: vi.fn().mockResolvedValue('https://r2.example.com/upload'),
    });

    const useCase = new RequestUploadUrlUseCase({ applicationRepository, storageProvider });
    const result = await useCase.execute({
      userId: 'user-1',
      applicationId: 'app-1',
      filename: 'resume.pdf',
      mimeType: 'application/pdf',
    });

    expect(result.uploadUrl).toBe('https://r2.example.com/upload');
    expect(result.storageKey).toBe('users/user-1/applications/app-1/fixed-nanoid-resume.pdf');
    expect(storageProvider.getPresignedUploadUrl).toHaveBeenCalledWith(
      result.storageKey,
      'application/pdf',
    );
  });

  it('throws VALIDATION when the mimeType is not allowed', async () => {
    const applicationRepository = makeApplicationRepository({
      findById: vi.fn().mockResolvedValue(makeApplication()),
    });

    const useCase = new RequestUploadUrlUseCase({
      applicationRepository,
      storageProvider: makeStorageProvider(),
    });
    const err = await useCase
      .execute({
        userId: 'user-1',
        applicationId: 'app-1',
        filename: 'malware.exe',
        mimeType: 'application/x-msdownload',
      })
      .catch((e) => e);

    expect((err as { code: string }).code).toBe('VALIDATION');
    expect(applicationRepository.findById).not.toHaveBeenCalled();
  });

  it('sanitizes the filename — replaces spaces and strips special characters', async () => {
    const applicationRepository = makeApplicationRepository({
      findById: vi.fn().mockResolvedValue(makeApplication()),
    });
    const storageProvider = makeStorageProvider({
      getPresignedUploadUrl: vi.fn().mockResolvedValue('https://r2.example.com/upload'),
    });

    const useCase = new RequestUploadUrlUseCase({ applicationRepository, storageProvider });
    const result = await useCase.execute({
      userId: 'user-1',
      applicationId: 'app-1',
      filename: 'my résumé (final) v2.pdf',
      mimeType: 'application/pdf',
    });

    // spaces → hyphens, accented chars and parens stripped
    expect(result.storageKey).toMatch(/fixed-nanoid-my-rsum-final-v2\.pdf$/);
  });
});
