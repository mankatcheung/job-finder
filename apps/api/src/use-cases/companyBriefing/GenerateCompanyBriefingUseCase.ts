import type { ILLMProviderFactory } from '#src/use-cases/ports/ILLMProviderFactory.js';
import type { LLMMessage } from '#src/use-cases/ports/ILLMProvider.js';
import type { IApplicationRepository } from '#src/use-cases/ports/IApplicationRepository.js';
import type { IUserRepository } from '#src/use-cases/ports/IUserRepository.js';
import type { IRateLimiter } from '#src/use-cases/ports/IRateLimiter.js';
import { wrapUntrustedContent } from '#src/use-cases/shared/wrapUntrustedContent.js';
import { ERROR_CODES, AI_PROMPT_INPUT } from '#src/constants.js';

export interface GenerateCompanyBriefingInput {
  applicationId: string;
  userId: string;
}

interface Deps {
  llmProviderFactory: ILLMProviderFactory;
  applicationRepository: IApplicationRepository;
  userRepository: IUserRepository;
  generateCompanyBriefingRateLimiter: IRateLimiter;
}

const SYSTEM_PROMPT = `You are a career research assistant preparing a candidate for a job application. Given a company, role, and job description, write a concise pre-interview briefing covering:

1. Company overview — what the company does, in a sentence or two.
2. Culture signals — what's likely true about how this company operates, based on its industry, size, and the tone of the job description.
3. Likely interview style — what kind of interview process a company like this typically runs (e.g. take-home vs. live coding, panel vs. 1:1, how many rounds).
4. Talking points — 3-5 specific things the candidate could bring up to show genuine interest and preparation.

Do NOT include a "recent news" section or reference specific current events, funding rounds, layoffs, leadership changes, or anything time-sensitive — you have no reliable access to real-time information, and presenting stale or fabricated "recent" facts as current would be actively misleading. If you don't have confident general knowledge of the company, say so plainly rather than guessing specifics.

Return plain text with short section headers, no markdown formatting.`;

export class GenerateCompanyBriefingUseCase {
  constructor(private readonly deps: Deps) {}

  async execute(input: GenerateCompanyBriefingInput): Promise<string> {
    if (
      !this.deps.generateCompanyBriefingRateLimiter.consume(`company-briefing:user:${input.userId}`)
    ) {
      throw Object.assign(new Error('Too many requests — please wait a moment and try again'), {
        code: ERROR_CODES.RATE_LIMITED,
      });
    }

    const app = await this.deps.applicationRepository.findById(input.applicationId);
    if (!app) {
      throw Object.assign(new Error('Application not found'), { code: ERROR_CODES.NOT_FOUND });
    }
    if (app.userId !== input.userId) {
      throw Object.assign(new Error('Forbidden'), { code: ERROR_CODES.FORBIDDEN });
    }

    const llmProvider = await this.deps.llmProviderFactory.forUser(input.userId);
    if (!llmProvider) {
      throw Object.assign(new Error('Add your AI API key in Settings to use this feature'), {
        code: ERROR_CODES.AI_NOT_CONFIGURED,
      });
    }

    const user = await this.deps.userRepository.findById(input.userId);
    const userPrompt = this.buildPrompt(app);

    const messages: LLMMessage[] = [{ role: 'system', content: SYSTEM_PROMPT }];
    if (user?.customAiPrompt) {
      messages.push({ role: 'system', content: user.customAiPrompt });
    }
    messages.push({ role: 'user', content: userPrompt });

    return llmProvider.complete(messages, 768);
  }

  private buildPrompt(app: {
    company: string;
    role: string;
    location?: string | null;
    description?: string | null;
  }): string {
    const lines = [
      `Prepare a briefing for this application:`,
      `Company: ${app.company}`,
      `Role: ${app.role}`,
      ...(app.location ? [`Location: ${app.location}`] : []),
      ...(app.description
        ? [
            `\nJob description:\n${wrapUntrustedContent(app.description.slice(0, AI_PROMPT_INPUT.COMPANY_BRIEFING_JOB_DESCRIPTION_MAX_CHARS))}`,
          ]
        : []),
    ];

    return lines.join('\n');
  }
}
