import type { ILLMProvider } from '#src/use-cases/ports/ILLMProvider.js';

export interface ParseJobDescriptionInput {
  text?: string | null;
  url?: string | null;
}

export interface ParsedJobDescription {
  company: string | null;
  role: string | null;
  location: string | null;
  salary: string | null;
  description: string | null;
}

interface Deps {
  llmProvider: ILLMProvider;
}

const SYSTEM_PROMPT = `You are a job posting parser. Extract structured data from job postings and return ONLY valid JSON with no markdown, no explanation, and no code fences. If a field cannot be determined, use null.`;

const USER_PROMPT_TEMPLATE = (
  text: string,
) => `Extract the following from this job posting and return ONLY valid JSON:
{
  "company": "company name or null",
  "role": "job title or null",
  "location": "location (city, remote, hybrid, etc.) or null",
  "salary": "salary range or null",
  "description": "2-3 sentence summary of the role and key requirements, or null"
}

Job posting:
${text.slice(0, 8000)}`;

export class ParseJobDescriptionUseCase {
  constructor(private readonly deps: Deps) {}

  async execute(input: ParseJobDescriptionInput): Promise<ParsedJobDescription> {
    const text = await this.resolveText(input);
    if (!text.trim()) throw new Error('No job description content provided');

    const raw = await this.deps.llmProvider.complete([
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: USER_PROMPT_TEMPLATE(text) },
    ]);

    return this.parseResponse(raw);
  }

  private async resolveText(input: ParseJobDescriptionInput): Promise<string> {
    if (input.text?.trim()) return input.text;

    if (input.url?.trim()) {
      const response = await fetch(input.url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; JobFinderBot/1.0)' },
        signal: AbortSignal.timeout(10_000),
      });
      if (!response.ok) throw new Error(`Failed to fetch URL: ${response.status}`);
      const html = await response.text();
      return this.stripHtml(html);
    }

    throw new Error('Either text or url must be provided');
  }

  private stripHtml(html: string): string {
    return html
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/\s{2,}/g, ' ')
      .trim();
  }

  private parseResponse(raw: string): ParsedJobDescription {
    const clean = raw
      .trim()
      .replace(/^```(?:json)?/i, '')
      .replace(/```$/, '')
      .trim();
    try {
      const parsed = JSON.parse(clean) as Partial<ParsedJobDescription>;
      return {
        company: parsed.company ?? null,
        role: parsed.role ?? null,
        location: parsed.location ?? null,
        salary: parsed.salary ?? null,
        description: parsed.description ?? null,
      };
    } catch {
      return { company: null, role: null, location: null, salary: null, description: null };
    }
  }
}
