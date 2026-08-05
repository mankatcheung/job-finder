import type { IDocumentDraftRepository } from '#src/use-cases/ports/IDocumentDraftRepository.js';
import type { IApplicationRepository } from '#src/use-cases/ports/IApplicationRepository.js';
import { NotFoundError, ForbiddenError } from '#src/http/errors/AppError.js';

export interface DeleteDocumentDraftCommand {
  userId: string;
  draftId: string;
}

export interface IDeleteDocumentDraftUseCase {
  execute(command: DeleteDocumentDraftCommand): Promise<void>;
}

interface Deps {
  documentDraftRepository: IDocumentDraftRepository;
  applicationRepository: IApplicationRepository;
}

export class DeleteDocumentDraftUseCase implements IDeleteDocumentDraftUseCase {
  constructor(private readonly deps: Deps) {}

  async execute(command: DeleteDocumentDraftCommand): Promise<void> {
    const draft = await this.deps.documentDraftRepository.findById(command.draftId);
    if (!draft) {
      throw new NotFoundError('Document draft not found');
    }

    const app = await this.deps.applicationRepository.findById(draft.applicationId);
    if (!app || app.userId !== command.userId) {
      throw new ForbiddenError('Not authorized');
    }

    await this.deps.documentDraftRepository.delete(command.draftId);
  }
}
