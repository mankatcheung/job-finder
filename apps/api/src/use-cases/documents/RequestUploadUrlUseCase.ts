import { ForbiddenError, NotFoundError } from '#src/use-cases/errors/DomainError.js';
import { nanoid } from 'nanoid';
import type { IApplicationRepository } from '#src/use-cases/ports/IApplicationRepository.js';
import type { IStorageProvider } from '#src/use-cases/ports/IStorageProvider.js';
import { assertAllowedMimeType } from '#src/use-cases/documents/documentValidation.js';
import type {
  IRequestUploadUrlUseCase,
  RequestUploadUrlInput,
  RequestUploadUrlOutput,
} from '#src/use-cases/documents/IRequestUploadUrlUseCase.js';

interface Deps {
  applicationRepository: IApplicationRepository;
  storageProvider: IStorageProvider;
}

function sanitizeFilename(name: string): string {
  return name
    .replace(/\s+/g, '-')
    .replace(/[^a-zA-Z0-9._-]/g, '')
    .slice(0, 200);
}

export class RequestUploadUrlUseCase implements IRequestUploadUrlUseCase {
  constructor(private readonly deps: Deps) {}

  async execute(input: RequestUploadUrlInput): Promise<RequestUploadUrlOutput> {
    assertAllowedMimeType(input.mimeType);

    const app = await this.deps.applicationRepository.findById(input.applicationId);
    if (!app) {
      throw new NotFoundError('Application not found');
    }
    if (app.userId !== input.userId) {
      throw new ForbiddenError('Forbidden');
    }

    const sanitized = sanitizeFilename(input.filename);
    const storageKey = `users/${input.userId}/applications/${input.applicationId}/${nanoid()}-${sanitized}`;
    const uploadUrl = await this.deps.storageProvider.getPresignedUploadUrl(
      storageKey,
      input.mimeType,
    );

    return { uploadUrl, storageKey };
  }
}
