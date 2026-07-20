import type { IApplicationRepository } from '@/use-cases/ports/IApplicationRepository.js';
import type { IDocumentRepository } from '@/use-cases/ports/IDocumentRepository.js';
import type {
  IGetDocumentsUseCase,
  GetDocumentsInput,
  GetDocumentsOutput,
} from '@/use-cases/documents/IGetDocumentsUseCase.js';

interface Deps {
  applicationRepository: IApplicationRepository;
  documentRepository: IDocumentRepository;
}

export class GetDocumentsUseCase implements IGetDocumentsUseCase {
  constructor(private readonly deps: Deps) {}

  async execute(input: GetDocumentsInput): Promise<GetDocumentsOutput> {
    const app = await this.deps.applicationRepository.findById(input.applicationId);
    if (!app) {
      throw Object.assign(new Error('Application not found'), { code: 'NOT_FOUND' });
    }
    if (app.userId !== input.userId) {
      throw Object.assign(new Error('Forbidden'), { code: 'FORBIDDEN' });
    }

    return this.deps.documentRepository.findAllByApplicationId(input.applicationId);
  }
}
