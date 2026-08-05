import { describe, it, expect, vi } from 'vitest';
import { CreateDocumentDraftUseCase } from '#src/use-cases/documents/CreateDocumentDraftUseCase.js';
import {
  makeApplicationRepository,
  makeDocumentDraftRepository,
  makeApplication,
  makeDocumentDraft,
} from '#src/__tests__/helpers/mocks.js';

describe('CreateDocumentDraftUseCase', () => {
  it('throws NOT_FOUND when the application does not exist', async () => {
    const applicationRepository = makeApplicationRepository({
      findById: vi.fn().mockResolvedValue(null),
    });

    const useCase = new CreateDocumentDraftUseCase(
      makeDocumentDraftRepository(),
      applicationRepository,
    );
    const err = await useCase
      .execute({
        userId: 'user-1',
        applicationId: 'app-missing',
        type: 'cover_letter',
        title: 'Test',
      })
      .catch((e) => e);

    expect(err).toBeInstanceOf(Error);
    expect((err as { code: string }).code).toBe('NOT_FOUND');
  });

  it('throws NOT_FOUND when the application belongs to another user', async () => {
    const applicationRepository = makeApplicationRepository({
      findById: vi.fn().mockResolvedValue(makeApplication({ userId: 'other-user' })),
    });

    const useCase = new CreateDocumentDraftUseCase(
      makeDocumentDraftRepository(),
      applicationRepository,
    );
    const err = await useCase
      .execute({ userId: 'user-1', applicationId: 'app-1', type: 'cover_letter', title: 'Test' })
      .catch((e) => e);

    expect(err).toBeInstanceOf(Error);
    expect((err as { code: string }).code).toBe('NOT_FOUND');
  });

  it('creates a draft with the correct data', async () => {
    const draft = makeDocumentDraft({ title: 'My Cover Letter' });
    const applicationRepository = makeApplicationRepository({
      findById: vi.fn().mockResolvedValue(makeApplication()),
    });
    const documentDraftRepository = makeDocumentDraftRepository({
      create: vi.fn().mockResolvedValue(draft),
    });

    const useCase = new CreateDocumentDraftUseCase(documentDraftRepository, applicationRepository);
    const result = await useCase.execute({
      userId: 'user-1',
      applicationId: 'app-1',
      type: 'cover_letter',
      title: 'My Cover Letter',
      contentJson: '{"type":"doc","content":[]}',
      plainText: '',
    });

    expect(result).toEqual(draft);
    expect(documentDraftRepository.create).toHaveBeenCalledWith({
      id: expect.any(String),
      applicationId: 'app-1',
      type: 'cover_letter',
      title: 'My Cover Letter',
      contentJson: '{"type":"doc","content":[]}',
      plainText: '',
      sourceDocumentId: undefined,
    });
  });
});
