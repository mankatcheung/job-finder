import { ForbiddenError, NotFoundError } from '#src/use-cases/errors/DomainError.js';
import type { IApplicationRepository } from '#src/use-cases/ports/IApplicationRepository.js';
import type { IDocumentRepository } from '#src/use-cases/ports/IDocumentRepository.js';
import type { IStorageProvider } from '#src/use-cases/ports/IStorageProvider.js';
import type {
  IDeleteApplicationUseCase,
  DeleteApplicationInput,
} from '#src/use-cases/jobs/IDeleteApplicationUseCase.js';

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
      throw new NotFoundError('Application not found');
    }
    if (app.userId !== input.userId) {
      throw new ForbiddenError('Forbidden');
    }

    const documents = await this.deps.documentRepository.findAllByApplicationId(
      input.applicationId,
    );
    await Promise.all(documents.map((doc) => this.deps.storageProvider.delete(doc.storageKey)));

    await this.deps.applicationRepository.delete(input.applicationId);
  }
}
