import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ParseJobDescriptionUseCase } from '#src/use-cases/jobDescription/ParseJobDescriptionUseCase.js';
import type { ILLMProvider } from '#src/use-cases/ports/ILLMProvider.js';

function makeLLMProvider(response: string): ILLMProvider {
  return { complete: vi.fn().mockResolvedValue(response) };
}

describe('ParseJobDescriptionUseCase', () => {
  let llmProvider: ILLMProvider;

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
  });

  it('extracts fields from raw text', async () => {
    const useCase = new ParseJobDescriptionUseCase({ llmProvider });
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
    const useCase = new ParseJobDescriptionUseCase({ llmProvider });
    const result = await useCase.execute({ text: 'job posting' });
    expect(result.company).toBe('Acme');
    expect(result.role).toBe('SWE');
  });

  it('returns all-null result when LLM returns invalid JSON', async () => {
    llmProvider = makeLLMProvider('Sorry, I cannot parse this.');
    const useCase = new ParseJobDescriptionUseCase({ llmProvider });
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
    const useCase = new ParseJobDescriptionUseCase({ llmProvider });
    await expect(useCase.execute({})).rejects.toThrow('Either text or url must be provided');
  });

  it('throws when text is empty string', async () => {
    const useCase = new ParseJobDescriptionUseCase({ llmProvider });
    await expect(useCase.execute({ text: '   ' })).rejects.toThrow(
      'Either text or url must be provided',
    );
  });

  it('fetches URL and passes text to LLM', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => '<html><body><p>Senior Engineer at Acme Corp</p></body></html>',
    } as unknown as Response);

    const useCase = new ParseJobDescriptionUseCase({ llmProvider });
    await useCase.execute({ url: 'https://example.com/job' });

    expect(global.fetch).toHaveBeenCalledWith('https://example.com/job', expect.any(Object));
    const [messages] = (llmProvider.complete as ReturnType<typeof vi.fn>).mock.calls[0] as [
      Array<{ role: string; content: string }>,
    ];
    expect(
      messages.some((m) => m.role === 'user' && m.content.includes('Senior Engineer at Acme Corp')),
    ).toBe(true);
  });

  it('throws when URL fetch fails', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
    } as unknown as Response);

    const useCase = new ParseJobDescriptionUseCase({ llmProvider });
    await expect(useCase.execute({ url: 'https://example.com/missing' })).rejects.toThrow(
      'Failed to fetch URL: 404',
    );
  });
});
