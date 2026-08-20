import { ForbiddenError, NotFoundError } from '#src/use-cases/errors/DomainError.js';
import type { IApplicationRepository } from '#src/use-cases/ports/IApplicationRepository.js';
import type { IDocumentRepository } from '#src/use-cases/ports/IDocumentRepository.js';
import type {
  IGetDocumentsUseCase,
  GetDocumentsInput,
  GetDocumentsOutput,
} from '#src/use-cases/documents/IGetDocumentsUseCase.js';

interface Deps {
  applicationRepository: IApplicationRepository;
  documentRepository: IDocumentRepository;
}

export class GetDocumentsUseCase implements IGetDocumentsUseCase {
  constructor(private readonly deps: Deps) {}

  async execute(input: GetDocumentsInput): Promise<GetDocumentsOutput> {
    const app = await this.deps.applicationRepository.findById(input.applicationId);
    if (!app) {
      throw new NotFoundError('Application not found');
    }
    if (app.userId !== input.userId) {
      throw new ForbiddenError('Forbidden');
    }

    return this.deps.documentRepository.findAllByApplicationId(input.applicationId);
  }
}
