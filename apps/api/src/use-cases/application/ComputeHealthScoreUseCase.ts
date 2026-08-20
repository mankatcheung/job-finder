import { ForbiddenError, NotFoundError } from '#src/use-cases/errors/DomainError.js';
import type { IApplicationRepository } from '#src/use-cases/ports/IApplicationRepository.js';
import type { INoteRepository } from '#src/use-cases/ports/INoteRepository.js';
import type { IDocumentRepository } from '#src/use-cases/ports/IDocumentRepository.js';
import type { IInterviewRoundRepository } from '#src/use-cases/ports/IInterviewRoundRepository.js';
import type { IContactRepository } from '#src/use-cases/ports/IContactRepository.js';

export interface HealthScoreCriterion {
  key: string;
  label: string;
  points: number;
  earned: number;
  met: boolean;
}

export interface HealthScore {
  score: number;
  label: string;
  criteria: HealthScoreCriterion[];
}

interface Deps {
  applicationRepository: IApplicationRepository;
  noteRepository: INoteRepository;
  documentRepository: IDocumentRepository;
  interviewRoundRepository: IInterviewRoundRepository;
  contactRepository: IContactRepository;
}

const CRITERIA: Array<{ key: string; label: string; points: number }> = [
  { key: 'description', label: 'Job description captured', points: 20 },
  { key: 'appliedAt', label: 'Applied date logged', points: 15 },
  { key: 'hasNotes', label: 'Notes added', points: 10 },
  { key: 'hasDocuments', label: 'Documents attached', points: 10 },
  { key: 'followUpAt', label: 'Follow-up date planned', points: 10 },
  { key: 'hasInterviews', label: 'Interview rounds tracked', points: 10 },
  { key: 'jobUrl', label: 'Job URL saved', points: 5 },
  { key: 'salaryRange', label: 'Salary range noted', points: 5 },
  { key: 'location', label: 'Location noted', points: 5 },
  { key: 'source', label: 'Source tracked', points: 5 },
  { key: 'hasContacts', label: 'Contact tracked', points: 5 },
];

function scoreLabel(score: number): string {
  if (score >= 91) return 'Complete';
  if (score >= 71) return 'Looking good';
  if (score >= 41) return 'In progress';
  return 'Needs attention';
}

export class ComputeHealthScoreUseCase {
  constructor(private readonly deps: Deps) {}

  async execute(applicationId: string, userId: string): Promise<HealthScore> {
    const app = await this.deps.applicationRepository.findById(applicationId);
    if (!app) {
      throw new NotFoundError('Application not found');
    }
    if (app.userId !== userId) {
      throw new ForbiddenError('Forbidden');
    }

    const [notes, documents, rounds, contacts] = await Promise.all([
      this.deps.noteRepository.findAllByApplicationId(applicationId),
      this.deps.documentRepository.findAllByApplicationId(applicationId),
      this.deps.interviewRoundRepository.findAllByApplicationId(applicationId),
      this.deps.contactRepository.findAllByApplicationId(applicationId),
    ]);

    const metKeys = new Set<string>();
    if (app.description?.trim()) metKeys.add('description');
    if (app.appliedAt) metKeys.add('appliedAt');
    if (app.followUpAt) metKeys.add('followUpAt');
    if (app.jobUrl) metKeys.add('jobUrl');
    if (app.salaryRange) metKeys.add('salaryRange');
    if (app.location) metKeys.add('location');
    if (app.source) metKeys.add('source');
    if (notes.length > 0) metKeys.add('hasNotes');
    if (documents.length > 0) metKeys.add('hasDocuments');
    if (rounds.length > 0) metKeys.add('hasInterviews');
    if (contacts.length > 0) metKeys.add('hasContacts');

    const criteria: HealthScoreCriterion[] = CRITERIA.map((c) => ({
      key: c.key,
      label: c.label,
      points: c.points,
      earned: metKeys.has(c.key) ? c.points : 0,
      met: metKeys.has(c.key),
    }));

    const score = criteria.reduce((sum, c) => sum + c.earned, 0);

    return { score, label: scoreLabel(score), criteria };
  }
}
