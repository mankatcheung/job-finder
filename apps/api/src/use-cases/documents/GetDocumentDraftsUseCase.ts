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

export class GetDocumentDraftsUseCase implements IGetDocumentDraftsUseCase {
  constructor(
    private readonly documentDraftRepository: IDocumentDraftRepository,
    private readonly applicationRepository: IApplicationRepository,
  ) {}

  async execute(query: GetDocumentDraftsQuery): Promise<DocumentDraft[]> {
    const app = await this.applicationRepository.findById(query.applicationId);
    if (!app || app.userId !== query.userId) {
      throw new NotFoundError('Application not found');
    }

    return this.documentDraftRepository.findAllByApplicationId(query.applicationId);
  }
}
