import type { Document } from '#src/domain/document/Document.js';
import type { IDocumentDraftRepository } from '#src/use-cases/ports/IDocumentDraftRepository.js';
import type {
  IDocumentRepository,
  CreateDocumentData,
} from '#src/use-cases/ports/IDocumentRepository.js';
import type { IApplicationRepository } from '#src/use-cases/ports/IApplicationRepository.js';
import type { IStorageProvider } from '#src/use-cases/ports/IStorageProvider.js';
import type { IPdfRenderer } from '#src/use-cases/ports/IPdfRenderer.js';
import { NotFoundError, ForbiddenError } from '#src/http/errors/AppError.js';

export interface ExportDocumentDraftToPdfCommand {
  userId: string;
  draftId: string;
}

export interface IExportDocumentDraftToPdfUseCase {
  execute(command: ExportDocumentDraftToPdfCommand): Promise<Document>;
}

export class ExportDocumentDraftToPdfUseCase implements IExportDocumentDraftToPdfUseCase {
  constructor(
    private readonly documentDraftRepository: IDocumentDraftRepository,
    private readonly documentRepository: IDocumentRepository,
    private readonly applicationRepository: IApplicationRepository,
    private readonly storageProvider: IStorageProvider,
    private readonly pdfRenderer: IPdfRenderer,
  ) {}

  async execute(command: ExportDocumentDraftToPdfCommand): Promise<Document> {
    const draft = await this.documentDraftRepository.findById(command.draftId);
    if (!draft) {
      throw new NotFoundError('Document draft not found');
    }

    const app = await this.applicationRepository.findById(draft.applicationId);
    if (!app || app.userId !== command.userId) {
      throw new ForbiddenError('Not authorized');
    }

    const pdfBuffer = await this.pdfRenderer.render({
      title: draft.title,
      contentJson: draft.contentJson,
    });

    const docId = crypto.randomUUID();
    const storageKey = `documents/${draft.applicationId}/${docId}.pdf`;
    const fileName = `${draft.title.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;

    await this.storageProvider.putObject(storageKey, pdfBuffer, 'application/pdf');

    const createData: CreateDocumentData = {
      id: docId,
      applicationId: draft.applicationId,
      name: fileName,
      mimeType: 'application/pdf',
      sizeBytes: pdfBuffer.length,
      storageKey,
      documentType: draft.type,
      sourceDraftId: draft.id,
    };

    return this.documentRepository.create(createData);
  }
}
