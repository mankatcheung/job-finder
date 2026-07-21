import type { ILLMProvider } from '@/use-cases/ports/ILLMProvider.js';
import type { IApplicationRepository } from '@/use-cases/ports/IApplicationRepository.js';

export interface GenerateCoverLetterInput {
  applicationId: string;
  userId: string;
  resumeText?: string | null;
}

interface Deps {
  llmProvider: ILLMProvider;
  applicationRepository: IApplicationRepository;
}

const SYSTEM_PROMPT = `You are a professional cover letter writer. Write compelling, personalized cover letters that are concise (3-4 paragraphs), specific to the role, and written in first person. Return ONLY the cover letter body — no subject line, no date, no address block, no explanation.`;

export class GenerateCoverLetterUseCase {
  constructor(private readonly deps: Deps) {}

  async execute(input: GenerateCoverLetterInput): Promise<string> {
    const app = await this.deps.applicationRepository.findById(input.applicationId);
    if (!app) throw new Error('Application not found');
    if (app.userId !== input.userId) throw new Error('Unauthorized');

    const userPrompt = this.buildPrompt(app, input.resumeText);

    return this.deps.llmProvider.complete(
      [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
      1024,
    );
  }

  private buildPrompt(
    app: { company: string; role: string; location?: string | null; description?: string | null },
    resumeText?: string | null,
  ): string {
    const lines = [
      `Write a cover letter for this job application:`,
      `Company: ${app.company}`,
      `Role: ${app.role}`,
      ...(app.location ? [`Location: ${app.location}`] : []),
      ...(app.description ? [`\nJob description:\n${app.description.slice(0, 3000)}`] : []),
      ...(resumeText?.trim()
        ? [`\nMy background / resume:\n${resumeText.trim().slice(0, 4000)}`]
        : ['\nWrite a strong general cover letter for someone applying to this role.']),
    ];
    return lines.join('\n');
  }
}
