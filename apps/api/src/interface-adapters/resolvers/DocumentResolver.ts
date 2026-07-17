import type { IRequestUploadUrlUseCase } from '@/use-cases/documents/IRequestUploadUrlUseCase.js';
import type { IConfirmDocumentUseCase } from '@/use-cases/documents/IConfirmDocumentUseCase.js';
import type { IGetDocumentsUseCase } from '@/use-cases/documents/IGetDocumentsUseCase.js';
import type { IDeleteDocumentUseCase } from '@/use-cases/documents/IDeleteDocumentUseCase.js';
import type { IStorageProvider } from '@/use-cases/ports/IStorageProvider.js';
import type { DocumentMapper, DocumentDTO } from '@/interface-adapters/mappers/DocumentMapper.js';

interface Deps {
  requestUploadUrlUseCase: IRequestUploadUrlUseCase;
  confirmDocumentUseCase: IConfirmDocumentUseCase;
  getDocumentsUseCase: IGetDocumentsUseCase;
  deleteDocumentUseCase: IDeleteDocumentUseCase;
  storageProvider: IStorageProvider;
  documentMapper: DocumentMapper;
}

interface UploadUrlPayload {
  uploadUrl: string;
  storageKey: string;
}

interface ConfirmInput {
  applicationId: string;
  storageKey: string;
  name: string;
  mimeType: string;
  sizeBytes: number;
}

export class DocumentResolver {
  constructor(private readonly deps: Deps) {}

  async getDocuments(userId: string, applicationId: string): Promise<DocumentDTO[]> {
    const docs = await this.deps.getDocumentsUseCase.execute({ userId, applicationId });
    return Promise.all(
      docs.map(async (doc) => {
        const url = await this.deps.storageProvider.getSignedUrl(doc.storageKey);
        return this.deps.documentMapper.toDTO(doc, url);
      }),
    );
  }

  async requestUploadUrl(
    userId: string,
    applicationId: string,
    filename: string,
    mimeType: string,
  ): Promise<UploadUrlPayload> {
    return this.deps.requestUploadUrlUseCase.execute({
      userId,
      applicationId,
      filename,
      mimeType,
    });
  }

  async confirmDocument(userId: string, input: ConfirmInput): Promise<DocumentDTO> {
    const doc = await this.deps.confirmDocumentUseCase.execute({ userId, ...input });
    const url = await this.deps.storageProvider.getSignedUrl(doc.storageKey);
    return this.deps.documentMapper.toDTO(doc, url);
  }

  async deleteDocument(userId: string, documentId: string): Promise<boolean> {
    await this.deps.deleteDocumentUseCase.execute({ userId, documentId });
    return true;
  }
}
