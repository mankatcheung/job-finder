import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ParseJobDescriptionUseCase } from '#src/use-cases/jobDescription/ParseJobDescriptionUseCase.js';
import type { ILLMProvider } from '#src/use-cases/ports/ILLMProvider.js';
import type { IJobPostingSourceResolver } from '#src/use-cases/ports/IJobPostingSourceResolver.js';

function makeLLMProvider(response: string): ILLMProvider {
  return { complete: vi.fn().mockResolvedValue(response) };
}

function makeSourceResolver(text: string): IJobPostingSourceResolver {
  return { resolve: vi.fn().mockResolvedValue(text) };
}

describe('ParseJobDescriptionUseCase', () => {
  let llmProvider: ILLMProvider;
  let jobPostingSourceResolver: IJobPostingSourceResolver;

  beforeEach(() => {
    llmProvider = makeLLMProvider(
      JSON.stringify({
        company: 'Acme Corp',
        role: 'Senior Engineer',
        location: 'Remote',
        salary: '$140k–$180k',
        description: 'Build distributed systems.',
      }),
    );
    jobPostingSourceResolver = makeSourceResolver('We are Acme Corp looking for a Senior Engineer');
  });

  it('extracts fields from raw text', async () => {
    const useCase = new ParseJobDescriptionUseCase({ llmProvider, jobPostingSourceResolver });
    const result = await useCase.execute({
      text: 'We are Acme Corp looking for a Senior Engineer',
    });

    expect(result).toEqual({
      company: 'Acme Corp',
      role: 'Senior Engineer',
      location: 'Remote',
      salary: '$140k–$180k',
      description: 'Build distributed systems.',
    });
    expect(llmProvider.complete).toHaveBeenCalledOnce();
  });

  it('strips markdown code fences from LLM response', async () => {
    llmProvider = makeLLMProvider(
      '```json\n{"company":"Acme","role":"SWE","location":null,"salary":null,"description":null}\n```',
    );
    const useCase = new ParseJobDescriptionUseCase({ llmProvider, jobPostingSourceResolver });
    const result = await useCase.execute({ text: 'job posting' });
    expect(result.company).toBe('Acme');
    expect(result.role).toBe('SWE');
  });

  it('returns all-null result when LLM returns invalid JSON', async () => {
    llmProvider = makeLLMProvider('Sorry, I cannot parse this.');
    const useCase = new ParseJobDescriptionUseCase({ llmProvider, jobPostingSourceResolver });
    const result = await useCase.execute({ text: 'some text' });
    expect(result).toEqual({
      company: null,
      role: null,
      location: null,
      salary: null,
      description: null,
    });
  });

  it('throws when neither text nor url is provided', async () => {
    jobPostingSourceResolver = {
      resolve: vi.fn().mockRejectedValue(new Error('Either text or url must be provided')),
    };
    const useCase = new ParseJobDescriptionUseCase({ llmProvider, jobPostingSourceResolver });
    await expect(useCase.execute({})).rejects.toThrow('Either text or url must be provided');
  });

  it('throws when text is empty string', async () => {
    jobPostingSourceResolver = {
      resolve: vi.fn().mockRejectedValue(new Error('Either text or url must be provided')),
    };
    const useCase = new ParseJobDescriptionUseCase({ llmProvider, jobPostingSourceResolver });
    await expect(useCase.execute({ text: '   ' })).rejects.toThrow(
      'Either text or url must be provided',
    );
  });

  it('fetches URL and passes text to LLM', async () => {
    jobPostingSourceResolver = {
      resolve: vi.fn().mockResolvedValue('Senior Engineer at Acme Corp'),
    };

    const useCase = new ParseJobDescriptionUseCase({ llmProvider, jobPostingSourceResolver });
    await useCase.execute({ url: 'https://example.com/job' });

    expect(jobPostingSourceResolver.resolve).toHaveBeenCalledWith({
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

    const useCase = new ParseJobDescriptionUseCase({ llmProvider, jobPostingSourceResolver });
    await expect(useCase.execute({ url: 'https://example.com/missing' })).rejects.toThrow(
      'Failed to fetch URL: 404',
    );
  });
});
