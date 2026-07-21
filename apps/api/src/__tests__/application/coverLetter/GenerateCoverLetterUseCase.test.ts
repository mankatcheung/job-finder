import { describe, it, expect, vi } from 'vitest';
import { GenerateCoverLetterUseCase } from '@/use-cases/coverLetter/GenerateCoverLetterUseCase.js';
import { makeApplicationRepository, makeApplication } from '@/__tests__/helpers/mocks.js';
import type { ILLMProvider } from '@/use-cases/ports/ILLMProvider.js';

const COVER_LETTER = 'Dear Hiring Manager,\n\nI am excited to apply…\n\nSincerely,\nJane';

function makeLLMProvider(response = COVER_LETTER): ILLMProvider {
  return { complete: vi.fn().mockResolvedValue(response) };
}

describe('GenerateCoverLetterUseCase', () => {
  it('returns the LLM response as the cover letter', async () => {
    const app = makeApplication({ description: 'We build great software.' });
    const applicationRepository = makeApplicationRepository({
      findById: vi.fn().mockResolvedValue(app),
    });
    const llmProvider = makeLLMProvider();

    const result = await new GenerateCoverLetterUseCase({
      applicationRepository,
      llmProvider,
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

    await new GenerateCoverLetterUseCase({ applicationRepository, llmProvider }).execute({
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

    await new GenerateCoverLetterUseCase({ applicationRepository, llmProvider }).execute({
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

  it('throws when application is not found', async () => {
    const applicationRepository = makeApplicationRepository({
      findById: vi.fn().mockResolvedValue(null),
    });
    const llmProvider = makeLLMProvider();

    await expect(
      new GenerateCoverLetterUseCase({ applicationRepository, llmProvider }).execute({
        applicationId: 'missing',
        userId: 'user-1',
      }),
    ).rejects.toThrow('Application not found');
  });

  it('throws when application belongs to a different user', async () => {
    const app = makeApplication({ userId: 'user-2' });
    const applicationRepository = makeApplicationRepository({
      findById: vi.fn().mockResolvedValue(app),
    });
    const llmProvider = makeLLMProvider();

    await expect(
      new GenerateCoverLetterUseCase({ applicationRepository, llmProvider }).execute({
        applicationId: 'app-1',
        userId: 'user-1',
      }),
    ).rejects.toThrow('Unauthorized');
  });
});
