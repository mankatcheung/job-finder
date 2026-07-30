import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ParseJobDescriptionUseCase } from '#src/use-cases/jobDescription/ParseJobDescriptionUseCase.js';
import { makeLLMProvider, makeLLMProviderFactory } from '#src/__tests__/helpers/mocks.js';
import type { ILLMProviderFactory } from '#src/use-cases/ports/ILLMProviderFactory.js';
import type { IJobPostingSourceResolver } from '#src/use-cases/ports/IJobPostingSourceResolver.js';

function makeSourceResolver(text: string): IJobPostingSourceResolver {
  return { resolve: vi.fn().mockResolvedValue(text) };
}

describe('ParseJobDescriptionUseCase', () => {
  let llmProviderFactory: ILLMProviderFactory;
  let jobPostingSourceResolver: IJobPostingSourceResolver;

  beforeEach(() => {
    llmProviderFactory = makeLLMProviderFactory({
      forUser: vi.fn().mockResolvedValue(
        makeLLMProvider(
          JSON.stringify({
            company: 'Acme Corp',
            role: 'Senior Engineer',
            location: 'Remote',
            salary: '$140k–$180k',
            description: 'Build distributed systems.',
          }),
        ),
      ),
    });
    jobPostingSourceResolver = makeSourceResolver('We are Acme Corp looking for a Senior Engineer');
  });

  it('extracts fields from raw text', async () => {
    const useCase = new ParseJobDescriptionUseCase({
      llmProviderFactory,
      jobPostingSourceResolver,
    });
    const result = await useCase.execute({
      userId: 'user-1',
      text: 'We are Acme Corp looking for a Senior Engineer',
    });

    expect(result).toEqual({
      company: 'Acme Corp',
      role: 'Senior Engineer',
      location: 'Remote',
      salary: '$140k–$180k',
      description: 'Build distributed systems.',
    });
  });

  it('strips markdown code fences from LLM response', async () => {
    llmProviderFactory = makeLLMProviderFactory({
      forUser: vi
        .fn()
        .mockResolvedValue(
          makeLLMProvider(
            '```json\n{"company":"Acme","role":"SWE","location":null,"salary":null,"description":null}\n```',
          ),
        ),
    });
    const useCase = new ParseJobDescriptionUseCase({
      llmProviderFactory,
      jobPostingSourceResolver,
    });
    const result = await useCase.execute({ userId: 'user-1', text: 'job posting' });
    expect(result.company).toBe('Acme');
    expect(result.role).toBe('SWE');
  });

  it('returns all-null result when LLM returns invalid JSON', async () => {
    llmProviderFactory = makeLLMProviderFactory({
      forUser: vi.fn().mockResolvedValue(makeLLMProvider('Sorry, I cannot parse this.')),
    });
    const useCase = new ParseJobDescriptionUseCase({
      llmProviderFactory,
      jobPostingSourceResolver,
    });
    const result = await useCase.execute({ userId: 'user-1', text: 'some text' });
    expect(result).toEqual({
      company: null,
      role: null,
      location: null,
      salary: null,
      description: null,
    });
  });

  it('throws AI_NOT_CONFIGURED when the user has no LLM API key set up', async () => {
    llmProviderFactory = makeLLMProviderFactory({ forUser: vi.fn().mockResolvedValue(null) });
    const useCase = new ParseJobDescriptionUseCase({
      llmProviderFactory,
      jobPostingSourceResolver,
    });

    const err = await useCase.execute({ userId: 'user-1', text: 'some text' }).catch((e) => e);

    expect((err as { code: string }).code).toBe('AI_NOT_CONFIGURED');
    expect(jobPostingSourceResolver.resolve).not.toHaveBeenCalled();
  });

  it('throws when neither text nor url is provided', async () => {
    jobPostingSourceResolver = {
      resolve: vi.fn().mockRejectedValue(new Error('Either text or url must be provided')),
    };
    const useCase = new ParseJobDescriptionUseCase({
      llmProviderFactory,
      jobPostingSourceResolver,
    });
    await expect(useCase.execute({ userId: 'user-1' })).rejects.toThrow(
      'Either text or url must be provided',
    );
  });

  it('throws when text is empty string', async () => {
    jobPostingSourceResolver = {
      resolve: vi.fn().mockRejectedValue(new Error('Either text or url must be provided')),
    };
    const useCase = new ParseJobDescriptionUseCase({
      llmProviderFactory,
      jobPostingSourceResolver,
    });
    await expect(useCase.execute({ userId: 'user-1', text: '   ' })).rejects.toThrow(
      'Either text or url must be provided',
    );
  });

  it('fetches URL and passes text to LLM', async () => {
    const llmProvider = makeLLMProvider(
      JSON.stringify({
        company: 'Acme Corp',
        role: 'Senior Engineer',
        location: 'Remote',
        salary: '$140k–$180k',
        description: 'Build distributed systems.',
      }),
    );
    llmProviderFactory = makeLLMProviderFactory({
      forUser: vi.fn().mockResolvedValue(llmProvider),
    });
    jobPostingSourceResolver = {
      resolve: vi.fn().mockResolvedValue('Senior Engineer at Acme Corp'),
    };

    const useCase = new ParseJobDescriptionUseCase({
      llmProviderFactory,
      jobPostingSourceResolver,
    });
    await useCase.execute({ userId: 'user-1', url: 'https://example.com/job' });

    expect(jobPostingSourceResolver.resolve).toHaveBeenCalledWith({
      text: undefined,
      url: 'https://example.com/job',
    });
    const [messages] = (llmProvider.complete as ReturnType<typeof vi.fn>).mock.calls[0] as [
      Array<{ role: string; content: string }>,
    ];
    expect(
      messages.some((m) => m.role === 'user' && m.content.includes('Senior Engineer at Acme Corp')),
    ).toBe(true);
  });

  it('throws when source resolver fails', async () => {
    jobPostingSourceResolver = {
      resolve: vi.fn().mockRejectedValue(new Error('Failed to fetch URL: 404')),
    };

    const useCase = new ParseJobDescriptionUseCase({
      llmProviderFactory,
      jobPostingSourceResolver,
    });
    await expect(
      useCase.execute({ userId: 'user-1', url: 'https://example.com/missing' }),
    ).rejects.toThrow('Failed to fetch URL: 404');
  });
});
