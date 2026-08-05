import type { DocumentDraft } from '#src/domain/documentDraft/DocumentDraft.js';
import type { IDocumentDraftRepository } from '#src/use-cases/ports/IDocumentDraftRepository.js';
import type { IApplicationRepository } from '#src/use-cases/ports/IApplicationRepository.js';
import { NotFoundError } from '#src/http/errors/AppError.js';

export interface GetDocumentDraftsQuery {
  userId: string;
  applicationId: string;
}

export interface IGetDocumentDraftsUseCase {
  execute(query: GetDocumentDraftsQuery): Promise<DocumentDraft[]>;
}

interface Deps {
  documentDraftRepository: IDocumentDraftRepository;
  applicationRepository: IApplicationRepository;
}

export class GetDocumentDraftsUseCase implements IGetDocumentDraftsUseCase {
  constructor(private readonly deps: Deps) {}

  async execute(query: GetDocumentDraftsQuery): Promise<DocumentDraft[]> {
    const app = await this.deps.applicationRepository.findById(query.applicationId);
    if (!app || app.userId !== query.userId) {
      throw new NotFoundError('Application not found');
    }

    return this.deps.documentDraftRepository.findAllByApplicationId(query.applicationId);
  }
}
