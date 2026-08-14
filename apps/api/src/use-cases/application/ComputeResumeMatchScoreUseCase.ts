import { z } from 'zod';
import type { IApplicationRepository } from '#src/use-cases/ports/IApplicationRepository.js';
import type { IDocumentRepository } from '#src/use-cases/ports/IDocumentRepository.js';
import type { IStorageProvider } from '#src/use-cases/ports/IStorageProvider.js';
import type { IDocumentTextExtractor } from '#src/use-cases/ports/IDocumentTextExtractor.js';
import type { ILLMProviderFactory } from '#src/use-cases/ports/ILLMProviderFactory.js';
import type { IWorkExperienceRepository } from '#src/use-cases/ports/IWorkExperienceRepository.js';
import type { IEducationRepository } from '#src/use-cases/ports/IEducationRepository.js';
import type { ISkillRepository } from '#src/use-cases/ports/ISkillRepository.js';
import type { IRateLimiter } from '#src/use-cases/ports/IRateLimiter.js';
import { wrapUntrustedContent } from '#src/use-cases/shared/wrapUntrustedContent.js';
import { parseAiJson } from '#src/use-cases/shared/parseAiJson.js';
import { ERROR_CODES, AI_PROMPT_INPUT } from '#src/constants.js';

export interface ComputeResumeMatchScoreInput {
  applicationId: string;
  userId: string;
  resumeText?: string | null;
}

export interface ResumeMatchScore {
  score: number;
  label: string;
  matchedKeywords: string[];
  missingKeywords: string[];
  summary: string;
}

interface Deps {
  applicationRepository: IApplicationRepository;
  documentRepository: IDocumentRepository;
  storageProvider: IStorageProvider;
  documentTextExtractor: IDocumentTextExtractor;
  llmProviderFactory: ILLMProviderFactory;
  workExperienceRepository: IWorkExperienceRepository;
  educationRepository: IEducationRepository;
  skillRepository: ISkillRepository;
  computeResumeMatchScoreRateLimiter: IRateLimiter;
}

const RESUME_DOCUMENT_TYPE = 'resume';

const SYSTEM_PROMPT = `You are an ATS (applicant tracking system) resume screener. Compare a resume against a job description and return ONLY valid JSON with no markdown, no explanation, and no code fences.`;

const USER_PROMPT_TEMPLATE = (
  jobDescription: string,
  resumeText: string,
) => `Compare this resume against the job description below. Return ONLY valid JSON in this exact shape:
{
  "matchPercentage": <number 0-100>,
  "matchedKeywords": ["keyword1", "keyword2", ...],
  "missingKeywords": ["keyword1", "keyword2", ...],
  "summary": "2-3 sentence summary of the fit and the biggest gaps"
}

Job description:
${wrapUntrustedContent(jobDescription.slice(0, AI_PROMPT_INPUT.RESUME_MATCH_JOB_DESCRIPTION_MAX_CHARS))}

Resume:
${resumeText.slice(0, 6000)}`;

// matchPercentage is intentionally left unclamped here — parseResponse()
// clamps it to 0-100 after parsing, same as before this validation existed.
// matchedKeywords/missingKeywords are the specific gap called out in
// JEF-108: previously never checked to actually be arrays, so a
// malformed-but-truthy value (e.g. a string) passed straight through.
const resumeMatchLlmResponseSchema = z.object({
  matchPercentage: z.number().optional(),
  matchedKeywords: z.array(z.string()).optional(),
  missingKeywords: z.array(z.string()).optional(),
  summary: z.string().optional(),
});

function scoreLabel(score: number): string {
  if (score >= 90) return 'Excellent match';
  if (score >= 70) return 'Good match';
  if (score >= 40) return 'Some overlap';
  return 'Needs work';
}

export class ComputeResumeMatchScoreUseCase {
  constructor(private readonly deps: Deps) {}

  async execute(input: ComputeResumeMatchScoreInput): Promise<ResumeMatchScore> {
    if (
      !(await this.deps.computeResumeMatchScoreRateLimiter.consume(
        `resume-match:user:${input.userId}`,
      ))
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

    const jobDescription = app.description?.trim();
    if (!jobDescription) {
      throw Object.assign(
        new Error('Add a job description to this application before checking resume match'),
        { code: ERROR_CODES.VALIDATION },
      );
    }

    const resumeText = await this.resolveResumeText(input);

    const raw = await llmProvider.complete([
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: USER_PROMPT_TEMPLATE(jobDescription, resumeText) },
    ]);

    return this.parseResponse(raw);
  }

  private async resolveResumeText(input: ComputeResumeMatchScoreInput): Promise<string> {
    if (input.resumeText?.trim()) return input.resumeText.trim();

    const documents = await this.deps.documentRepository.findAllByApplicationId(
      input.applicationId,
    );
    const resumeDoc = documents
      .filter((d) => d.documentType === RESUME_DOCUMENT_TYPE)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0];

    if (resumeDoc) {
      const url = await this.deps.storageProvider.getSignedUrl(resumeDoc.storageKey);
      const response = await fetch(url);
      if (!response.ok) {
        throw Object.assign(new Error('Failed to read the uploaded resume file'), {
          code: ERROR_CODES.SERVICE_UNAVAILABLE,
        });
      }
      const buffer = Buffer.from(await response.arrayBuffer());
      const text = await this.deps.documentTextExtractor.extract(buffer, resumeDoc.mimeType);

      if (text.trim()) return text;
    }

    const profile = await this.buildProfile(input.userId);
    if (profile) return profile;

    throw Object.assign(
      new Error(
        'Upload a resume, paste your resume text, or add work experience and skills to your profile',
      ),
      { code: ERROR_CODES.VALIDATION },
    );
  }

  private async buildProfile(userId: string): Promise<string> {
    const [workExperiences, educations, skills] = await Promise.all([
      this.deps.workExperienceRepository.findAllByUserId(userId),
      this.deps.educationRepository.findAllByUserId(userId),
      this.deps.skillRepository.findAllByUserId(userId),
    ]);

    if (workExperiences.length === 0 && educations.length === 0 && skills.length === 0) {
      return '';
    }

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

  private parseResponse(raw: string): ResumeMatchScore {
    const parsed = parseAiJson(raw, resumeMatchLlmResponseSchema);
    const score = Math.max(0, Math.min(100, Math.round(parsed.matchPercentage ?? 0)));
    return {
      score,
      label: scoreLabel(score),
      matchedKeywords: parsed.matchedKeywords ?? [],
      missingKeywords: parsed.missingKeywords ?? [],
      summary: parsed.summary ?? '',
    };
  }
}
