import type { IApplicationRepository } from '#src/use-cases/ports/IApplicationRepository.js';
import type { IDocumentRepository } from '#src/use-cases/ports/IDocumentRepository.js';
import type { IStorageProvider } from '#src/use-cases/ports/IStorageProvider.js';
import type { IActivityLogRepository } from '#src/use-cases/ports/IActivityLogRepository.js';
import { ERROR_CODES } from '#src/constants.js';
import type {
  IDeleteDocumentUseCase,
  DeleteDocumentInput,
} from '#src/use-cases/documents/IDeleteDocumentUseCase.js';

interface Deps {
  applicationRepository: IApplicationRepository;
  documentRepository: IDocumentRepository;
  storageProvider: IStorageProvider;
  activityLogRepository?: IActivityLogRepository;
  generateId?: () => string;
}

export class DeleteDocumentUseCase implements IDeleteDocumentUseCase {
  constructor(private readonly deps: Deps) {}

  async execute(input: DeleteDocumentInput): Promise<void> {
    const doc = await this.deps.documentRepository.findById(input.documentId);
    if (!doc) {
      throw Object.assign(new Error('Document not found'), { code: ERROR_CODES.NOT_FOUND });
    }

    const app = await this.deps.applicationRepository.findById(doc.applicationId);
    if (!app || app.userId !== input.userId) {
      throw Object.assign(new Error('Forbidden'), { code: ERROR_CODES.FORBIDDEN });
    }

    await this.deps.storageProvider.delete(doc.storageKey);
    await this.deps.documentRepository.delete(input.documentId);

    if (this.deps.activityLogRepository && this.deps.generateId)
      await this.deps.activityLogRepository.append({
        id: this.deps.generateId(),
        applicationId: doc.applicationId,
        actorId: input.userId,
        eventType: 'document_deleted',
        payload: JSON.stringify({ documentId: input.documentId, name: doc.name }),
      });
  }
}
