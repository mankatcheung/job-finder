import type { DocumentDraft } from '#src/domain/documentDraft/DocumentDraft.js';
import type {
  IDocumentDraftRepository,
  CreateDocumentDraftData,
} from '#src/use-cases/ports/IDocumentDraftRepository.js';
import type { IApplicationRepository } from '#src/use-cases/ports/IApplicationRepository.js';
import { NotFoundError } from '#src/http/errors/AppError.js';

export interface CreateDocumentDraftCommand {
  userId: string;
  applicationId: string;
  type: 'cover_letter' | 'resume';
  title: string;
  contentJson?: string;
  plainText?: string;
  sourceDocumentId?: string | null;
}

export interface ICreateDocumentDraftUseCase {
  execute(command: CreateDocumentDraftCommand): Promise<DocumentDraft>;
}

export class CreateDocumentDraftUseCase implements ICreateDocumentDraftUseCase {
  constructor(
    private readonly documentDraftRepository: IDocumentDraftRepository,
    private readonly applicationRepository: IApplicationRepository,
  ) {}

  async execute(command: CreateDocumentDraftCommand): Promise<DocumentDraft> {
    const app = await this.applicationRepository.findById(command.applicationId);
    if (!app || app.userId !== command.userId) {
      throw new NotFoundError('Application not found');
    }

    const id = crypto.randomUUID();
    const data: CreateDocumentDraftData = {
      id,
      applicationId: command.applicationId,
      type: command.type,
      title: command.title,
      contentJson: command.contentJson,
      plainText: command.plainText,
      sourceDocumentId: command.sourceDocumentId,
    };

    return this.documentDraftRepository.create(data);
  }
}
