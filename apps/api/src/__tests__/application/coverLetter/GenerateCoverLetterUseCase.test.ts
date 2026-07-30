import { describe, it, expect, vi } from 'vitest';
import { GenerateCoverLetterUseCase } from '#src/use-cases/coverLetter/GenerateCoverLetterUseCase.js';
import {
  makeApplicationRepository,
  makeApplication,
  makeLLMProvider,
  makeLLMProviderFactory,
} from '#src/__tests__/helpers/mocks.js';

const COVER_LETTER = 'Dear Hiring Manager,\n\nI am excited to apply…\n\nSincerely,\nJane';

describe('GenerateCoverLetterUseCase', () => {
  it('returns the LLM response as the cover letter', async () => {
    const app = makeApplication({ description: 'We build great software.' });
    const applicationRepository = makeApplicationRepository({
      findById: vi.fn().mockResolvedValue(app),
    });
    const llmProvider = makeLLMProvider(COVER_LETTER);
    const llmProviderFactory = makeLLMProviderFactory({
      forUser: vi.fn().mockResolvedValue(llmProvider),
    });

    const result = await new GenerateCoverLetterUseCase({
      applicationRepository,
      llmProviderFactory,
    }).execute({
      applicationId: 'app-1',
      userId: 'user-1',
    });

    expect(result).toBe(COVER_LETTER);
    expect(llmProvider.complete).toHaveBeenCalledOnce();
  });

  it('includes resume text in the prompt when provided', async () => {
    const app = makeApplication();
    const applicationRepository = makeApplicationRepository({
      findById: vi.fn().mockResolvedValue(app),
    });
    const llmProvider = makeLLMProvider();
    const llmProviderFactory = makeLLMProviderFactory({
      forUser: vi.fn().mockResolvedValue(llmProvider),
    });

    await new GenerateCoverLetterUseCase({ applicationRepository, llmProviderFactory }).execute({
      applicationId: 'app-1',
      userId: 'user-1',
      resumeText: '5 years at BigCorp building APIs',
    });

    const [messages] = (llmProvider.complete as ReturnType<typeof vi.fn>).mock.calls[0] as [
      Array<{ role: string; content: string }>,
    ];
    const userMessage = messages.find((m) => m.role === 'user')!;
    expect(userMessage.content).toContain('5 years at BigCorp building APIs');
  });

  it('includes application context in the prompt', async () => {
    const app = makeApplication({
      company: 'Stripe',
      role: 'Staff Engineer',
      description: 'Payments infra role',
    });
    const applicationRepository = makeApplicationRepository({
      findById: vi.fn().mockResolvedValue(app),
    });
    const llmProvider = makeLLMProvider();
    const llmProviderFactory = makeLLMProviderFactory({
      forUser: vi.fn().mockResolvedValue(llmProvider),
    });

    await new GenerateCoverLetterUseCase({ applicationRepository, llmProviderFactory }).execute({
      applicationId: 'app-1',
      userId: 'user-1',
    });

    const [messages] = (llmProvider.complete as ReturnType<typeof vi.fn>).mock.calls[0] as [
      Array<{ role: string; content: string }>,
    ];
    const userMessage = messages.find((m) => m.role === 'user')!;
    expect(userMessage.content).toContain('Stripe');
    expect(userMessage.content).toContain('Staff Engineer');
    expect(userMessage.content).toContain('Payments infra role');
  });

  it('throws NOT_FOUND when application is not found', async () => {
    const applicationRepository = makeApplicationRepository({
      findById: vi.fn().mockResolvedValue(null),
    });
    const llmProviderFactory = makeLLMProviderFactory();

    const err = await new GenerateCoverLetterUseCase({ applicationRepository, llmProviderFactory })
      .execute({ applicationId: 'missing', userId: 'user-1' })
      .catch((e) => e);

    expect(err).toBeInstanceOf(Error);
    expect((err as Error).message).toBe('Application not found');
    expect((err as { code: string }).code).toBe('NOT_FOUND');
  });

  it('throws FORBIDDEN when application belongs to a different user', async () => {
    const app = makeApplication({ userId: 'user-2' });
    const applicationRepository = makeApplicationRepository({
      findById: vi.fn().mockResolvedValue(app),
    });
    const llmProviderFactory = makeLLMProviderFactory();

    const err = await new GenerateCoverLetterUseCase({ applicationRepository, llmProviderFactory })
      .execute({ applicationId: 'app-1', userId: 'user-1' })
      .catch((e) => e);

    expect(err).toBeInstanceOf(Error);
    expect((err as { code: string }).code).toBe('FORBIDDEN');
  });

  it('throws AI_NOT_CONFIGURED when the user has no LLM API key set up', async () => {
    const app = makeApplication();
    const applicationRepository = makeApplicationRepository({
      findById: vi.fn().mockResolvedValue(app),
    });
    const llmProviderFactory = makeLLMProviderFactory({ forUser: vi.fn().mockResolvedValue(null) });

    const err = await new GenerateCoverLetterUseCase({ applicationRepository, llmProviderFactory })
      .execute({ applicationId: 'app-1', userId: 'user-1' })
      .catch((e) => e);

    expect((err as { code: string }).code).toBe('AI_NOT_CONFIGURED');
  });
});
