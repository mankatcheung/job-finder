import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ComputeResumeMatchScoreUseCase } from '#src/use-cases/application/ComputeResumeMatchScoreUseCase.js';
import {
  makeApplicationRepository,
  makeApplication,
  makeDocumentRepository,
  makeDocument,
  makeStorageProvider,
  makeDocumentTextExtractor,
  makeLLMProviderFactory,
  makeLLMProvider,
} from '#src/__tests__/helpers/mocks.js';

const MATCH_RESPONSE = JSON.stringify({
  matchPercentage: 82,
  matchedKeywords: ['TypeScript', 'GraphQL'],
  missingKeywords: ['Kubernetes'],
  summary: 'Strong overlap on core skills; missing infra experience.',
});

function makeDeps(overrides?: Record<string, unknown>) {
  return {
    applicationRepository: makeApplicationRepository({
      findById: vi
        .fn()
        .mockResolvedValue(makeApplication({ description: 'We need a TS engineer' })),
    }),
    documentRepository: makeDocumentRepository({
      findAllByApplicationId: vi.fn().mockResolvedValue([]),
    }),
    storageProvider: makeStorageProvider(),
    documentTextExtractor: makeDocumentTextExtractor(),
    llmProviderFactory: makeLLMProviderFactory({
      forUser: vi.fn().mockResolvedValue(makeLLMProvider(MATCH_RESPONSE)),
    }),
    ...overrides,
  };
}

describe('ComputeResumeMatchScoreUseCase', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        arrayBuffer: () => Promise.resolve(new TextEncoder().encode('resume bytes').buffer),
      }),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('throws NOT_FOUND when the application does not exist', async () => {
    const deps = makeDeps({
      applicationRepository: makeApplicationRepository({
        findById: vi.fn().mockResolvedValue(null),
      }),
    });

    const err = await new ComputeResumeMatchScoreUseCase(deps as never)
      .execute({ applicationId: 'missing', userId: 'user-1', resumeText: 'resume' })
      .catch((e) => e);

    expect((err as { code: string }).code).toBe('NOT_FOUND');
  });

  it('throws FORBIDDEN when the application belongs to a different user', async () => {
    const deps = makeDeps({
      applicationRepository: makeApplicationRepository({
        findById: vi
          .fn()
          .mockResolvedValue(makeApplication({ userId: 'user-2', description: 'JD' })),
      }),
    });

    const err = await new ComputeResumeMatchScoreUseCase(deps as never)
      .execute({ applicationId: 'app-1', userId: 'user-1', resumeText: 'resume' })
      .catch((e) => e);

    expect((err as { code: string }).code).toBe('FORBIDDEN');
  });

  it('throws AI_NOT_CONFIGURED when the user has no LLM API key set up', async () => {
    const deps = makeDeps({
      llmProviderFactory: makeLLMProviderFactory({ forUser: vi.fn().mockResolvedValue(null) }),
    });

    const err = await new ComputeResumeMatchScoreUseCase(deps as never)
      .execute({ applicationId: 'app-1', userId: 'user-1', resumeText: 'resume' })
      .catch((e) => e);

    expect((err as { code: string }).code).toBe('AI_NOT_CONFIGURED');
  });

  it('throws VALIDATION when the application has no job description', async () => {
    const deps = makeDeps({
      applicationRepository: makeApplicationRepository({
        findById: vi.fn().mockResolvedValue(makeApplication({ description: null })),
      }),
    });

    const err = await new ComputeResumeMatchScoreUseCase(deps as never)
      .execute({ applicationId: 'app-1', userId: 'user-1', resumeText: 'resume' })
      .catch((e) => e);

    expect((err as { code: string }).code).toBe('VALIDATION');
    expect((err as Error).message).toMatch(/job description/);
  });

  it('throws VALIDATION when there is no resumeText and no uploaded resume document', async () => {
    const deps = makeDeps();

    const err = await new ComputeResumeMatchScoreUseCase(deps as never)
      .execute({ applicationId: 'app-1', userId: 'user-1' })
      .catch((e) => e);

    expect((err as { code: string }).code).toBe('VALIDATION');
    expect((err as Error).message).toMatch(/Upload a resume or paste/);
  });

  it('uses the provided resumeText directly, skipping document lookup', async () => {
    const documentRepository = makeDocumentRepository({
      findAllByApplicationId: vi.fn().mockResolvedValue([]),
    });
    const deps = makeDeps({ documentRepository });

    await new ComputeResumeMatchScoreUseCase(deps as never).execute({
      applicationId: 'app-1',
      userId: 'user-1',
      resumeText: 'pasted resume text',
    });

    expect(documentRepository.findAllByApplicationId).not.toHaveBeenCalled();
  });

  it('falls back to the most recently created resume-type document when no resumeText is given', async () => {
    const older = makeDocument({
      id: 'doc-old',
      documentType: 'resume',
      createdAt: new Date('2024-01-01'),
      storageKey: 'old-key',
      mimeType: 'text/plain',
    });
    const newer = makeDocument({
      id: 'doc-new',
      documentType: 'resume',
      createdAt: new Date('2024-06-01'),
      storageKey: 'new-key',
      mimeType: 'text/plain',
    });
    const otherType = makeDocument({
      id: 'doc-other',
      documentType: 'cover-letter',
      createdAt: new Date('2024-12-01'),
      storageKey: 'other-key',
    });
    const documentRepository = makeDocumentRepository({
      findAllByApplicationId: vi.fn().mockResolvedValue([older, otherType, newer]),
    });
    const storageProvider = makeStorageProvider({
      getSignedUrl: vi.fn().mockResolvedValue('https://storage.example.com/signed'),
    });
    const deps = makeDeps({ documentRepository, storageProvider });

    await new ComputeResumeMatchScoreUseCase(deps as never).execute({
      applicationId: 'app-1',
      userId: 'user-1',
    });

    expect(storageProvider.getSignedUrl).toHaveBeenCalledWith('new-key');
  });

  it('extracts text from the fetched resume document via the text extractor', async () => {
    const resumeDoc = makeDocument({ documentType: 'resume', mimeType: 'application/pdf' });
    const documentRepository = makeDocumentRepository({
      findAllByApplicationId: vi.fn().mockResolvedValue([resumeDoc]),
    });
    const documentTextExtractor = makeDocumentTextExtractor({
      extract: vi.fn().mockResolvedValue('extracted PDF resume text'),
    });
    const deps = makeDeps({ documentRepository, documentTextExtractor });

    await new ComputeResumeMatchScoreUseCase(deps as never).execute({
      applicationId: 'app-1',
      userId: 'user-1',
    });

    expect(documentTextExtractor.extract).toHaveBeenCalledWith(
      expect.any(Buffer),
      'application/pdf',
    );
  });

  it('throws SERVICE_UNAVAILABLE when the resume file cannot be fetched', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }));
    const resumeDoc = makeDocument({ documentType: 'resume' });
    const documentRepository = makeDocumentRepository({
      findAllByApplicationId: vi.fn().mockResolvedValue([resumeDoc]),
    });
    const deps = makeDeps({ documentRepository });

    const err = await new ComputeResumeMatchScoreUseCase(deps as never)
      .execute({ applicationId: 'app-1', userId: 'user-1' })
      .catch((e) => e);

    expect((err as { code: string }).code).toBe('SERVICE_UNAVAILABLE');
  });

  it('throws VALIDATION when the extracted resume text is blank', async () => {
    const resumeDoc = makeDocument({ documentType: 'resume' });
    const documentRepository = makeDocumentRepository({
      findAllByApplicationId: vi.fn().mockResolvedValue([resumeDoc]),
    });
    const documentTextExtractor = makeDocumentTextExtractor({
      extract: vi.fn().mockResolvedValue('   '),
    });
    const deps = makeDeps({ documentRepository, documentTextExtractor });

    const err = await new ComputeResumeMatchScoreUseCase(deps as never)
      .execute({ applicationId: 'app-1', userId: 'user-1' })
      .catch((e) => e);

    expect((err as { code: string }).code).toBe('VALIDATION');
    expect((err as Error).message).toMatch(/Couldn't read any text/);
  });

  it('parses a valid LLM JSON response into the match score', async () => {
    const deps = makeDeps();

    const result = await new ComputeResumeMatchScoreUseCase(deps as never).execute({
      applicationId: 'app-1',
      userId: 'user-1',
      resumeText: 'resume text',
    });

    expect(result).toEqual({
      score: 82,
      label: 'Good match',
      matchedKeywords: ['TypeScript', 'GraphQL'],
      missingKeywords: ['Kubernetes'],
      summary: 'Strong overlap on core skills; missing infra experience.',
    });
  });

  it('strips markdown code fences from the LLM response', async () => {
    const llmProviderFactory = makeLLMProviderFactory({
      forUser: vi.fn().mockResolvedValue(makeLLMProvider(`\`\`\`json\n${MATCH_RESPONSE}\n\`\`\``)),
    });
    const deps = makeDeps({ llmProviderFactory });

    const result = await new ComputeResumeMatchScoreUseCase(deps as never).execute({
      applicationId: 'app-1',
      userId: 'user-1',
      resumeText: 'resume text',
    });

    expect(result.score).toBe(82);
  });

  it('falls back to a zeroed result when the LLM returns invalid JSON', async () => {
    const llmProviderFactory = makeLLMProviderFactory({
      forUser: vi.fn().mockResolvedValue(makeLLMProvider('not valid json')),
    });
    const deps = makeDeps({ llmProviderFactory });

    const result = await new ComputeResumeMatchScoreUseCase(deps as never).execute({
      applicationId: 'app-1',
      userId: 'user-1',
      resumeText: 'resume text',
    });

    expect(result).toEqual({
      score: 0,
      label: 'Needs work',
      matchedKeywords: [],
      missingKeywords: [],
      summary: '',
    });
  });

  it('clamps an out-of-range matchPercentage into 0-100', async () => {
    const llmProviderFactory = makeLLMProviderFactory({
      forUser: vi.fn().mockResolvedValue(makeLLMProvider(JSON.stringify({ matchPercentage: 150 }))),
    });
    const deps = makeDeps({ llmProviderFactory });

    const result = await new ComputeResumeMatchScoreUseCase(deps as never).execute({
      applicationId: 'app-1',
      userId: 'user-1',
      resumeText: 'resume text',
    });

    expect(result.score).toBe(100);
    expect(result.label).toBe('Excellent match');
  });

  it.each([
    [95, 'Excellent match'],
    [75, 'Good match'],
    [50, 'Some overlap'],
    [10, 'Needs work'],
  ])('labels a score of %i as %s', async (matchPercentage, expectedLabel) => {
    const llmProviderFactory = makeLLMProviderFactory({
      forUser: vi.fn().mockResolvedValue(makeLLMProvider(JSON.stringify({ matchPercentage }))),
    });
    const deps = makeDeps({ llmProviderFactory });

    const result = await new ComputeResumeMatchScoreUseCase(deps as never).execute({
      applicationId: 'app-1',
      userId: 'user-1',
      resumeText: 'resume text',
    });

    expect(result.label).toBe(expectedLabel);
  });
});
