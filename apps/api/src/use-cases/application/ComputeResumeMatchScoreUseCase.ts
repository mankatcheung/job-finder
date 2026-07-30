import type { IApplicationRepository } from '#src/use-cases/ports/IApplicationRepository.js';
import type { IDocumentRepository } from '#src/use-cases/ports/IDocumentRepository.js';
import type { IStorageProvider } from '#src/use-cases/ports/IStorageProvider.js';
import type { IDocumentTextExtractor } from '#src/use-cases/ports/IDocumentTextExtractor.js';
import type { ILLMProviderFactory } from '#src/use-cases/ports/ILLMProviderFactory.js';
import { ERROR_CODES } from '#src/constants.js';

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
${jobDescription.slice(0, 6000)}

Resume:
${resumeText.slice(0, 6000)}`;

function scoreLabel(score: number): string {
  if (score >= 90) return 'Excellent match';
  if (score >= 70) return 'Good match';
  if (score >= 40) return 'Some overlap';
  return 'Needs work';
}

export class ComputeResumeMatchScoreUseCase {
  constructor(private readonly deps: Deps) {}

  async execute(input: ComputeResumeMatchScoreInput): Promise<ResumeMatchScore> {
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

    if (!resumeDoc) {
      throw Object.assign(
        new Error('Upload a resume or paste your resume text to check the match'),
        { code: ERROR_CODES.VALIDATION },
      );
    }

    const url = await this.deps.storageProvider.getSignedUrl(resumeDoc.storageKey);
    const response = await fetch(url);
    if (!response.ok) {
      throw Object.assign(new Error('Failed to read the uploaded resume file'), {
        code: ERROR_CODES.SERVICE_UNAVAILABLE,
      });
    }
    const buffer = Buffer.from(await response.arrayBuffer());
    const text = await this.deps.documentTextExtractor.extract(buffer, resumeDoc.mimeType);

    if (!text.trim()) {
      throw Object.assign(
        new Error(
          "Couldn't read any text from the uploaded resume — try pasting your resume text instead",
        ),
        { code: ERROR_CODES.VALIDATION },
      );
    }

    return text;
  }

  private parseResponse(raw: string): ResumeMatchScore {
    const clean = raw
      .trim()
      .replace(/^```(?:json)?/i, '')
      .replace(/```$/, '')
      .trim();
    try {
      const parsed = JSON.parse(clean) as {
        matchPercentage?: number;
        matchedKeywords?: string[];
        missingKeywords?: string[];
        summary?: string;
      };
      const score = Math.max(0, Math.min(100, Math.round(parsed.matchPercentage ?? 0)));
      return {
        score,
        label: scoreLabel(score),
        matchedKeywords: parsed.matchedKeywords ?? [],
        missingKeywords: parsed.missingKeywords ?? [],
        summary: parsed.summary ?? '',
      };
    } catch {
      return {
        score: 0,
        label: scoreLabel(0),
        matchedKeywords: [],
        missingKeywords: [],
        summary: '',
      };
    }
  }
}
