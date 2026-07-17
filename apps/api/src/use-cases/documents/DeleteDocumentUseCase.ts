import type { IApplicationRepository } from '@/use-cases/ports/IApplicationRepository.js';
import type { IDocumentRepository } from '@/use-cases/ports/IDocumentRepository.js';
import type { IStorageProvider } from '@/use-cases/ports/IStorageProvider.js';
import type { IDeleteDocumentUseCase, DeleteDocumentInput } from '@/use-cases/documents/IDeleteDocumentUseCase.js';

interface Deps {
  applicationRepository: IApplicationRepository;
  documentRepository: IDocumentRepository;
  storageProvider: IStorageProvider;
}

export class DeleteDocumentUseCase implements IDeleteDocumentUseCase {
  constructor(private readonly deps: Deps) {}

  async execute(input: DeleteDocumentInput): Promise<void> {
    const doc = await this.deps.documentRepository.findById(input.documentId);
    if (!doc) {
      throw Object.assign(new Error('Document not found'), { code: 'NOT_FOUND' });
    }

    const app = await this.deps.applicationRepository.findById(doc.applicationId);
    if (!app || app.userId !== input.userId) {
      throw Object.assign(new Error('Forbidden'), { code: 'FORBIDDEN' });
    }

    await this.deps.storageProvider.delete(doc.storageKey);
    await this.deps.documentRepository.delete(input.documentId);
  }
}
