import type { DocumentDraft } from '#src/domain/documentDraft/DocumentDraft.js';
import type { IDocumentDraftRepository } from '#src/use-cases/ports/IDocumentDraftRepository.js';
import type { IApplicationRepository } from '#src/use-cases/ports/IApplicationRepository.js';
import {
  NotFoundError,
  ForbiddenError,
  ValidationError,
} from '#src/use-cases/errors/DomainError.js';

export interface RenameDocumentDraftCommand {
  userId: string;
  draftId: string;
  title: string;
}

export interface IRenameDocumentDraftUseCase {
  execute(command: RenameDocumentDraftCommand): Promise<DocumentDraft>;
}

interface Deps {
  documentDraftRepository: IDocumentDraftRepository;
  applicationRepository: IApplicationRepository;
}

/**
 * Separate from `UpdateDocumentDraftContentUseCase` on purpose: the editor
 * saves content as the user types, and shipping the title along with every one
 * of those writes would make a rename indistinguishable from an autosave —
 * including when a stale editor tab overwrites a rename made elsewhere.
 */
export class RenameDocumentDraftUseCase implements IRenameDocumentDraftUseCase {
  constructor(private readonly deps: Deps) {}

  async execute(command: RenameDocumentDraftCommand): Promise<DocumentDraft> {
    const title = command.title.trim();
    if (!title) {
      throw new ValidationError('Title is required');
    }

    const draft = await this.deps.documentDraftRepository.findById(command.draftId);
    if (!draft) {
      throw new NotFoundError('Document draft not found');
    }

    const app = await this.deps.applicationRepository.findById(draft.applicationId);
    if (!app || app.userId !== command.userId) {
      throw new ForbiddenError('Not authorized');
    }

    return this.deps.documentDraftRepository.rename(command.draftId, title);
  }
}
