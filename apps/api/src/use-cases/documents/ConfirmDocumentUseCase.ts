import type { IApplicationRepository } from '@/use-cases/ports/IApplicationRepository.js';
import type { IDocumentRepository } from '@/use-cases/ports/IDocumentRepository.js';
import type { IActivityLogRepository } from '@/use-cases/ports/IActivityLogRepository.js';
import { ERROR_CODES } from '@/constants.js';
import type {
  IConfirmDocumentUseCase,
  ConfirmDocumentInput,
  ConfirmDocumentOutput,
} from '@/use-cases/documents/IConfirmDocumentUseCase.js';

interface Deps {
  applicationRepository: IApplicationRepository;
  documentRepository: IDocumentRepository;
  activityLogRepository?: IActivityLogRepository;
  generateId: () => string;
}

export class ConfirmDocumentUseCase implements IConfirmDocumentUseCase {
  constructor(private readonly deps: Deps) {}

  async execute(input: ConfirmDocumentInput): Promise<ConfirmDocumentOutput> {
    const app = await this.deps.applicationRepository.findById(input.applicationId);
    if (!app) {
      throw Object.assign(new Error('Application not found'), { code: ERROR_CODES.NOT_FOUND });
    }
    if (app.userId !== input.userId) {
      throw Object.assign(new Error('Forbidden'), { code: ERROR_CODES.FORBIDDEN });
    }

    const doc = await this.deps.documentRepository.create({
      id: this.deps.generateId(),
      applicationId: input.applicationId,
      storageKey: input.storageKey,
      name: input.name,
      mimeType: input.mimeType,
      sizeBytes: input.sizeBytes,
      documentType: input.documentType,
      version: input.version,
    });

    await this.deps.activityLogRepository?.append({
      id: this.deps.generateId(),
      applicationId: input.applicationId,
      actorId: input.userId,
      eventType: 'document_uploaded',
      payload: JSON.stringify({ documentId: doc.id, name: doc.name }),
    });

    return doc;
  }
}
