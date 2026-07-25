import { nanoid } from 'nanoid';
import type { IApplicationRepository } from '@/use-cases/ports/IApplicationRepository.js';
import type { IStorageProvider } from '@/use-cases/ports/IStorageProvider.js';
import { ERROR_CODES } from '@/constants.js';
import { assertAllowedMimeType } from '@/use-cases/documents/documentValidation.js';
import type {
  IRequestUploadUrlUseCase,
  RequestUploadUrlInput,
  RequestUploadUrlOutput,
} from '@/use-cases/documents/IRequestUploadUrlUseCase.js';

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
      throw Object.assign(new Error('Application not found'), { code: ERROR_CODES.NOT_FOUND });
    }
    if (app.userId !== input.userId) {
      throw Object.assign(new Error('Forbidden'), { code: ERROR_CODES.FORBIDDEN });
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
