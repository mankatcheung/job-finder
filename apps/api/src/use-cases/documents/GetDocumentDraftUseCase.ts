import type { DocumentDraft } from '#src/domain/documentDraft/DocumentDraft.js';
import type { IDocumentDraftRepository } from '#src/use-cases/ports/IDocumentDraftRepository.js';
import type { IApplicationRepository } from '#src/use-cases/ports/IApplicationRepository.js';
import { NotFoundError, ForbiddenError } from '#src/http/errors/AppError.js';

export interface GetDocumentDraftQuery {
  userId: string;
  draftId: string;
}

export interface IGetDocumentDraftUseCase {
  execute(query: GetDocumentDraftQuery): Promise<DocumentDraft>;
}

interface Deps {
  documentDraftRepository: IDocumentDraftRepository;
  applicationRepository: IApplicationRepository;
}

export class GetDocumentDraftUseCase implements IGetDocumentDraftUseCase {
  constructor(private readonly deps: Deps) {}

  async execute(query: GetDocumentDraftQuery): Promise<DocumentDraft> {
    const draft = await this.deps.documentDraftRepository.findById(query.draftId);
    if (!draft) {
      throw new NotFoundError('Document draft not found');
    }

    const app = await this.deps.applicationRepository.findById(draft.applicationId);
    if (!app || app.userId !== query.userId) {
      throw new ForbiddenError('Not authorized');
    }

    return draft;
  }
}
