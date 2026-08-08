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
  makeWorkExperienceRepository,
  makeEducationRepository,
  makeSkillRepository,
  makeRateLimiter,
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
    workExperienceRepository: makeWorkExperienceRepository(),
    educationRepository: makeEducationRepository(),
    skillRepository: makeSkillRepository(),
    computeResumeMatchScoreRateLimiter: makeRateLimiter(),
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
    vi.restoreAllMocks();
  });

  it('throws NOT_FOUND when application is not found', async () => {
    const deps = makeDeps({
      applicationRepository: makeApplicationRepository({
        findById: vi.fn().mockResolvedValue(null),
      }),
    });

    const err = await new ComputeResumeMatchScoreUseCase(deps as never)
      .execute({ applicationId: 'missing', userId: 'user-1' })
      .catch((e) => e);

    expect((err as { code: string }).code).toBe('NOT_FOUND');
  });

  it('throws FORBIDDEN when application belongs to a different user', async () => {
    const deps = makeDeps({
      applicationRepository: makeApplicationRepository({
        findById: vi.fn().mockResolvedValue(makeApplication({ userId: 'user-2' })),
      }),
    });

    const err = await new ComputeResumeMatchScoreUseCase(deps as never)
      .execute({ applicationId: 'app-1', userId: 'user-1' })
      .catch((e) => e);

    expect((err as { code: string }).code).toBe('FORBIDDEN');
  });

  it('throws AI_NOT_CONFIGURED when the user has no LLM API key set up', async () => {
    const deps = makeDeps({
      llmProviderFactory: makeLLMProviderFactory({ forUser: vi.fn().mockResolvedValue(null) }),
    });

    const err = await new ComputeResumeMatchScoreUseCase(deps as never)
      .execute({ applicationId: 'app-1', userId: 'user-1' })
      .catch((e) => e);

    expect((err as { code: string }).code).toBe('AI_NOT_CONFIGURED');
  });

  it('throws VALIDATION when there is no job description', async () => {
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

  it('falls back to user profile when there is no resumeText and no uploaded resume document', async () => {
    const workExperienceRepository = makeWorkExperienceRepository({
      findAllByUserId: vi.fn().mockResolvedValue([
        {
          id: 'we-1',
          company: 'Acme',
          title: 'Engineer',
          startDate: new Date('2020-01-01'),
          endDate: null,
          description: 'Built things',
        },
      ]),
    });
    const skillRepository = makeSkillRepository({
      findAllByUserId: vi
        .fn()
        .mockResolvedValue([
          { id: 's-1', name: 'TypeScript', category: 'Language', proficiency: 'expert' },
        ]),
    });
    const deps = makeDeps({ workExperienceRepository, skillRepository });

    await new ComputeResumeMatchScoreUseCase(deps as never).execute({
      applicationId: 'app-1',
      userId: 'user-1',
    });

    const llmProvider = deps.llmProviderFactory.forUser as ReturnType<typeof vi.fn>;
    expect(llmProvider).toHaveBeenCalled();
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
    const documentRepository = makeDocumentRepository({
      findAllByApplicationId: vi.fn().mockResolvedValue([older, newer]),
    });
    const deps = makeDeps({ documentRepository });

    await new ComputeResumeMatchScoreUseCase(deps as never).execute({
      applicationId: 'app-1',
      userId: 'user-1',
    });

    const { storageProvider } = deps;
    expect(storageProvider.getSignedUrl).toHaveBeenCalledWith('new-key');
  });

  it('throws VALIDATION when the extracted resume text is blank', async () => {
    const documentRepository = makeDocumentRepository({
      findAllByApplicationId: vi.fn().mockResolvedValue([
        makeDocument({
          documentType: 'resume',
          storageKey: 'blank-key',
          mimeType: 'text/plain',
        }),
      ]),
    });
    const documentTextExtractor = makeDocumentTextExtractor({
      extract: vi.fn().mockResolvedValue('   '),
    });
    const skillRepository = makeSkillRepository({
      findAllByUserId: vi.fn().mockResolvedValue([]),
    });
    const deps = makeDeps({ documentRepository, documentTextExtractor, skillRepository });

    const err = await new ComputeResumeMatchScoreUseCase(deps as never)
      .execute({ applicationId: 'app-1', userId: 'user-1' })
      .catch((e) => e);

    expect((err as { code: string }).code).toBe('VALIDATION');
    expect((err as Error).message).toMatch(
      /Upload a resume, paste your resume text, or add work experience/,
    );
  });

  it('throws VALIDATION when fetch to storage fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }));
    const documentRepository = makeDocumentRepository({
      findAllByApplicationId: vi.fn().mockResolvedValue([
        makeDocument({
          documentType: 'resume',
          storageKey: 'fail-key',
          mimeType: 'text/plain',
        }),
      ]),
    });
    const deps = makeDeps({ documentRepository });

    const err = await new ComputeResumeMatchScoreUseCase(deps as never)
      .execute({ applicationId: 'app-1', userId: 'user-1' })
      .catch((e) => e);

    expect((err as { code: string }).code).toBe('SERVICE_UNAVAILABLE');
  });

  it('returns a parsed score when the LLM responds with valid JSON', async () => {
    const deps = makeDeps();

    const result = await new ComputeResumeMatchScoreUseCase(deps as never).execute({
      applicationId: 'app-1',
      userId: 'user-1',
      resumeText: 'TypeScript expert',
    });

    expect(result.score).toBe(82);
    expect(result.label).toBe('Good match');
    expect(result.matchedKeywords).toEqual(['TypeScript', 'GraphQL']);
    expect(result.missingKeywords).toEqual(['Kubernetes']);
    expect(result.summary).toBe('Strong overlap on core skills; missing infra experience.');
  });

  it('clamps score to 0-100', async () => {
    const deps = makeDeps({
      llmProviderFactory: makeLLMProviderFactory({
        forUser: vi
          .fn()
          .mockResolvedValue(makeLLMProvider(JSON.stringify({ matchPercentage: 150 }))),
      }),
    });

    const result = await new ComputeResumeMatchScoreUseCase(deps as never).execute({
      applicationId: 'app-1',
      userId: 'user-1',
      resumeText: 'resume',
    });

    expect(result.score).toBe(100);
  });

  it('returns a default score when the LLM responds with invalid JSON', async () => {
    const deps = makeDeps({
      llmProviderFactory: makeLLMProviderFactory({
        forUser: vi.fn().mockResolvedValue(makeLLMProvider('not json')),
      }),
    });

    const result = await new ComputeResumeMatchScoreUseCase(deps as never).execute({
      applicationId: 'app-1',
      userId: 'user-1',
      resumeText: 'resume',
    });

    expect(result.score).toBe(0);
    expect(result.label).toBe('Needs work');
  });

  it('strips markdown code fences from the LLM response before parsing', async () => {
    const json = JSON.stringify({
      matchPercentage: 95,
      matchedKeywords: [],
      missingKeywords: [],
      summary: 'Great.',
    });
    const deps = makeDeps({
      llmProviderFactory: makeLLMProviderFactory({
        forUser: vi.fn().mockResolvedValue(makeLLMProvider(`\`\`\`json\n${json}\n\`\`\``)),
      }),
    });

    const result = await new ComputeResumeMatchScoreUseCase(deps as never).execute({
      applicationId: 'app-1',
      userId: 'user-1',
      resumeText: 'resume',
    });

    expect(result.score).toBe(95);
    expect(result.label).toBe('Excellent match');
  });

  it('calls the LLM with the job description and resume text', async () => {
    const deps = makeDeps();

    await new ComputeResumeMatchScoreUseCase(deps as never).execute({
      applicationId: 'app-1',
      userId: 'user-1',
      resumeText: 'My resume content',
    });

    const llmProvider = deps.llmProviderFactory.forUser as ReturnType<typeof vi.fn>;
    const provider = await llmProvider.mock.results[0].value;
    const [messages] = provider.complete.mock.calls[0];
    const userMsg = messages.find((m: { role: string }) => m.role === 'user');

    expect(userMsg.content).toContain('We need a TS engineer');
    expect(userMsg.content).toContain('My resume content');
  });

  it('throws RATE_LIMITED when the rate limiter rejects the request', async () => {
    const deps = makeDeps({
      computeResumeMatchScoreRateLimiter: makeRateLimiter({
        consume: vi.fn().mockReturnValue(false),
      }),
    });

    const err = await new ComputeResumeMatchScoreUseCase(deps as never)
      .execute({ applicationId: 'app-1', userId: 'user-1' })
      .catch((e) => e);

    expect((err as { code: string }).code).toBe('RATE_LIMITED');
    expect(deps.applicationRepository.findById).not.toHaveBeenCalled();
  });
});
