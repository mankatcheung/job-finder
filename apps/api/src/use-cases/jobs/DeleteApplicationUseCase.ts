import type { IApplicationRepository } from '@/use-cases/ports/IApplicationRepository.js';
import type { IDocumentRepository } from '@/use-cases/ports/IDocumentRepository.js';
import type { IStorageProvider } from '@/use-cases/ports/IStorageProvider.js';
import { ERROR_CODES } from '@/constants.js';
import type {
  IDeleteApplicationUseCase,
  DeleteApplicationInput,
} from '@/use-cases/jobs/IDeleteApplicationUseCase.js';

interface Deps {
  applicationRepository: IApplicationRepository;
  documentRepository: IDocumentRepository;
  storageProvider: IStorageProvider;
}

export class DeleteApplicationUseCase implements IDeleteApplicationUseCase {
  constructor(private readonly deps: Deps) {}

  async execute(input: DeleteApplicationInput): Promise<void> {
    const app = await this.deps.applicationRepository.findById(input.applicationId);
    if (!app) {
      throw Object.assign(new Error('Application not found'), { code: ERROR_CODES.NOT_FOUND });
    }
    if (app.userId !== input.userId) {
      throw Object.assign(new Error('Forbidden'), { code: ERROR_CODES.FORBIDDEN });
    }

    const documents = await this.deps.documentRepository.findAllByApplicationId(
      input.applicationId,
    );
    await Promise.all(documents.map((doc) => this.deps.storageProvider.delete(doc.storageKey)));

    await this.deps.applicationRepository.delete(input.applicationId);
  }
}
