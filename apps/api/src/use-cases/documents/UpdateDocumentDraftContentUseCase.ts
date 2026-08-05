import type { DocumentDraft } from '#src/domain/documentDraft/DocumentDraft.js';
import type {
  IDocumentDraftRepository,
  UpdateDocumentDraftContentData,
} from '#src/use-cases/ports/IDocumentDraftRepository.js';
import type { IApplicationRepository } from '#src/use-cases/ports/IApplicationRepository.js';
import { NotFoundError, ForbiddenError } from '#src/http/errors/AppError.js';

export interface UpdateDocumentDraftContentCommand {
  userId: string;
  draftId: string;
  contentJson: string;
  plainText: string;
}

export interface IUpdateDocumentDraftContentUseCase {
  execute(command: UpdateDocumentDraftContentCommand): Promise<DocumentDraft>;
}

interface Deps {
  documentDraftRepository: IDocumentDraftRepository;
  applicationRepository: IApplicationRepository;
}

export class UpdateDocumentDraftContentUseCase implements IUpdateDocumentDraftContentUseCase {
  constructor(private readonly deps: Deps) {}

  async execute(command: UpdateDocumentDraftContentCommand): Promise<DocumentDraft> {
    const draft = await this.deps.documentDraftRepository.findById(command.draftId);
    if (!draft) {
      throw new NotFoundError('Document draft not found');
    }

    const app = await this.deps.applicationRepository.findById(draft.applicationId);
    if (!app || app.userId !== command.userId) {
      throw new ForbiddenError('Not authorized');
    }

    const data: UpdateDocumentDraftContentData = {
      contentJson: command.contentJson,
      plainText: command.plainText,
    };

    return this.deps.documentDraftRepository.updateContent(command.draftId, data);
  }
}
