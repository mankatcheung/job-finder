import type { ILLMProviderFactory } from '#src/use-cases/ports/ILLMProviderFactory.js';
import type { LLMMessage } from '#src/use-cases/ports/ILLMProvider.js';
import type { IApplicationRepository } from '#src/use-cases/ports/IApplicationRepository.js';
import type { IWorkExperienceRepository } from '#src/use-cases/ports/IWorkExperienceRepository.js';
import type { IEducationRepository } from '#src/use-cases/ports/IEducationRepository.js';
import type { ISkillRepository } from '#src/use-cases/ports/ISkillRepository.js';
import type { IUserRepository } from '#src/use-cases/ports/IUserRepository.js';
import type { IRateLimiter } from '#src/use-cases/ports/IRateLimiter.js';
import { wrapUntrustedContent } from '#src/use-cases/shared/wrapUntrustedContent.js';
import { ERROR_CODES, AI_PROMPT_INPUT } from '#src/constants.js';

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
}

const SYSTEM_PROMPT = `You are a professional cover letter writer. Write compelling, personalized cover letters that are concise (3-4 paragraphs), specific to the role, and written in first person. Return ONLY the cover letter body — no subject line, no date, no address block, no explanation.`;

export class GenerateCoverLetterUseCase {
  constructor(private readonly deps: Deps) {}

  async execute(input: GenerateCoverLetterInput): Promise<string> {
    if (
      !(await this.deps.generateCoverLetterRateLimiter.consume(`cover-letter:user:${input.userId}`))
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

    const [profile, user] = await Promise.all([
      this.buildProfile(input.userId),
      this.deps.userRepository.findById(input.userId),
    ]);
    const userPrompt = this.buildPrompt(app, profile, input.resumeText);

    const messages: LLMMessage[] = [{ role: 'system', content: SYSTEM_PROMPT }];
    if (user?.customAiPrompt) {
      messages.push({ role: 'system', content: user.customAiPrompt });
    }
    messages.push({ role: 'user', content: userPrompt });

    return llmProvider.complete(messages, 1024);
  }

  private async buildProfile(userId: string): Promise<string> {
    const [workExperiences, educations, skills] = await Promise.all([
      this.deps.workExperienceRepository.findAllByUserId(userId),
      this.deps.educationRepository.findAllByUserId(userId),
      this.deps.skillRepository.findAllByUserId(userId),
    ]);

    const lines: string[] = [];

    if (workExperiences.length > 0) {
      lines.push('Work Experience:');
      for (const we of workExperiences) {
        const end = we.endDate ? new Date(we.endDate).toLocaleDateString() : 'Present';
        lines.push(
          `- ${we.title} at ${we.company} (${new Date(we.startDate).toLocaleDateString()} – ${end})`,
        );
        if (we.description) lines.push(`  ${we.description.slice(0, 200)}`);
      }
    }

    if (educations.length > 0) {
      lines.push('\nEducation:');
      for (const edu of educations) {
        const end = edu.endDate ? new Date(edu.endDate).toLocaleDateString() : 'Present';
        lines.push(
          `- ${edu.degree ?? ''} ${edu.field ?? ''} at ${edu.institution} (${new Date(edu.startDate).toLocaleDateString()} – ${end})`,
        );
        if (edu.description) lines.push(`  ${edu.description.slice(0, 200)}`);
      }
    }

    if (skills.length > 0) {
      lines.push('\nSkills:');
      const grouped = skills.reduce(
        (acc, s) => {
          const cat = s.category ?? 'General';
          acc[cat] = acc[cat] || [];
          acc[cat].push(s.proficiency ? `${s.name} (${s.proficiency})` : s.name);
          return acc;
        },
        {} as Record<string, string[]>,
      );
      for (const [cat, names] of Object.entries(grouped)) {
        lines.push(`- ${cat}: ${names.join(', ')}`);
      }
    }

    return lines.join('\n');
  }

  private buildPrompt(
    app: { company: string; role: string; location?: string | null; description?: string | null },
    profile: string,
    resumeText?: string | null,
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
