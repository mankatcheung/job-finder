import { ForbiddenError, NotFoundError } from '#src/use-cases/errors/DomainError.js';
import type { IApplicationRepository } from '#src/use-cases/ports/IApplicationRepository.js';
import type { IDocumentRepository } from '#src/use-cases/ports/IDocumentRepository.js';
import type { IStorageProvider } from '#src/use-cases/ports/IStorageProvider.js';
import type { IActivityLogRepository } from '#src/use-cases/ports/IActivityLogRepository.js';
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
      throw new NotFoundError('Document not found');
    }

    const app = await this.deps.applicationRepository.findById(doc.applicationId);
    if (!app || app.userId !== input.userId) {
      throw new ForbiddenError('Forbidden');
    }

    await this.deps.storageProvider.delete(doc.storageKey);
    await this.deps.documentRepository.delete(input.documentId, doc.applicationId);

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
