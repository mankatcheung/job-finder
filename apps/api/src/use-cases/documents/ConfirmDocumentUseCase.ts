import type { IApplicationRepository } from '@/use-cases/ports/IApplicationRepository.js';
import type { IDocumentRepository } from '@/use-cases/ports/IDocumentRepository.js';
import type { IConfirmDocumentUseCase, ConfirmDocumentInput, ConfirmDocumentOutput } from '@/use-cases/documents/IConfirmDocumentUseCase.js';

interface Deps {
  applicationRepository: IApplicationRepository;
  documentRepository: IDocumentRepository;
  generateId: () => string;
}

export class ConfirmDocumentUseCase implements IConfirmDocumentUseCase {
  constructor(private readonly deps: Deps) {}

  async execute(input: ConfirmDocumentInput): Promise<ConfirmDocumentOutput> {
    const app = await this.deps.applicationRepository.findById(input.applicationId);
    if (!app) {
      throw Object.assign(new Error('Application not found'), { code: 'NOT_FOUND' });
    }
    if (app.userId !== input.userId) {
      throw Object.assign(new Error('Forbidden'), { code: 'FORBIDDEN' });
    }

    return this.deps.documentRepository.create({
      id: this.deps.generateId(),
      applicationId: input.applicationId,
      storageKey: input.storageKey,
      name: input.name,
      mimeType: input.mimeType,
      sizeBytes: input.sizeBytes,
    });
  }
}
