import {
  AiNotConfiguredError,
  ForbiddenError,
  NotFoundError,
  RateLimitedError,
} from '#src/use-cases/errors/DomainError.js';
import type { ILLMProviderFactory } from '#src/use-cases/ports/ILLMProviderFactory.js';
import type { LLMMessage } from '#src/use-cases/ports/ILLMProvider.js';
import type { IApplicationRepository } from '#src/use-cases/ports/IApplicationRepository.js';
import type { IWorkExperienceRepository } from '#src/use-cases/ports/IWorkExperienceRepository.js';
import type { IEducationRepository } from '#src/use-cases/ports/IEducationRepository.js';
import type { ISkillRepository } from '#src/use-cases/ports/ISkillRepository.js';
import type { IUserRepository } from '#src/use-cases/ports/IUserRepository.js';
import type { IRateLimiter } from '#src/use-cases/ports/IRateLimiter.js';
import type { INoteRepository } from '#src/use-cases/ports/INoteRepository.js';
import type { ICompanyBriefingRepository } from '#src/use-cases/ports/ICompanyBriefingRepository.js';
import { formatApplicationContext } from '#src/use-cases/shared/applicationContext.js';
import { wrapUntrustedContent } from '#src/use-cases/shared/wrapUntrustedContent.js';
import { loadUserProfile, formatUserProfile } from '#src/use-cases/shared/userProfile.js';
import { AI_PROMPT_INPUT } from '#src/constants.js';

export interface GenerateCoverLetterInput {
  applicationId: string;
  userId: string;
  resumeText?: string | null;
}

interface Deps {
  llmProviderFactory: ILLMProviderFactory;
  applicationRepository: IApplicationRepository;
  workExperienceRepository: IWorkExperienceRepository;
  educationRepository: IEducationRepository;
  skillRepository: ISkillRepository;
  userRepository: IUserRepository;
  generateCoverLetterRateLimiter: IRateLimiter;
  noteRepository: INoteRepository;
  companyBriefingRepository: ICompanyBriefingRepository;
}

const SYSTEM_PROMPT = `You are a professional cover letter writer. Write compelling, personalized cover letters that are concise (3-4 paragraphs), specific to the role, and written in first person. Return ONLY the cover letter body — no subject line, no date, no address block, no explanation.`;

export class GenerateCoverLetterUseCase {
  constructor(private readonly deps: Deps) {}

  async execute(input: GenerateCoverLetterInput): Promise<string> {
    if (
      !(await this.deps.generateCoverLetterRateLimiter.consume(`cover-letter:user:${input.userId}`))
    ) {
      throw new RateLimitedError('Too many requests — please wait a moment and try again');
    }

    const app = await this.deps.applicationRepository.findById(input.applicationId);
    if (!app) {
      throw new NotFoundError('Application not found');
    }
    if (app.userId !== input.userId) {
      throw new ForbiddenError('Forbidden');
    }

    const llmProvider = await this.deps.llmProviderFactory.forUser(input.userId);
    if (!llmProvider) {
      throw new AiNotConfiguredError('Add your AI API key in Settings to use this feature');
    }

    // Notes and the briefing are both optional — having neither is the normal
    // state, and generation works exactly as before when they are absent.
    const [profile, user, notes, briefing] = await Promise.all([
      loadUserProfile(this.deps, input.userId).then(formatUserProfile),
      this.deps.userRepository.findById(input.userId),
      this.deps.noteRepository.findAllByApplicationId(input.applicationId),
      this.deps.companyBriefingRepository.findByApplicationId(input.applicationId),
    ]);
    const context = formatApplicationContext({ notes, briefing });
    const userPrompt = this.buildPrompt(app, profile, input.resumeText, context);

    const messages: LLMMessage[] = [{ role: 'system', content: SYSTEM_PROMPT }];
    if (user?.customAiPrompt) {
      messages.push({ role: 'system', content: user.customAiPrompt });
    }
    messages.push({ role: 'user', content: userPrompt });

    return llmProvider.complete(messages, 1024);
  }

  private buildPrompt(
    app: { company: string; role: string; location?: string | null; description?: string | null },
    profile: string,
    resumeText: string | null | undefined,
    applicationContext: string,
  ): string {
    const lines = [
      `Write a cover letter for this job application:`,
      `Company: ${app.company}`,
      `Role: ${app.role}`,
      ...(app.location ? [`Location: ${app.location}`] : []),
      ...(app.description
        ? [
            `\nJob description:\n${wrapUntrustedContent(app.description.slice(0, AI_PROMPT_INPUT.COVER_LETTER_JOB_DESCRIPTION_MAX_CHARS))}`,
          ]
        : []),
    ];

    if (applicationContext) {
      lines.push(`\n${applicationContext}`);
    }

    if (resumeText?.trim()) {
      lines.push(`\nMy background / resume:\n${resumeText.trim().slice(0, 4000)}`);
    } else if (profile) {
      lines.push(`\nMy background:\n${profile.slice(0, 4000)}`);
    } else {
      lines.push('\nWrite a strong general cover letter for someone applying to this role.');
    }

    return lines.join('\n');
  }
}
