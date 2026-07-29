import { nanoid } from 'nanoid';
import type { IStorageProvider } from '#src/use-cases/ports/IStorageProvider.js';
import { assertAllowedAvatarMimeType } from '#src/use-cases/user/avatarValidation.js';
import type {
  IRequestAvatarUploadUrlUseCase,
  RequestAvatarUploadUrlInput,
  RequestAvatarUploadUrlOutput,
} from '#src/use-cases/user/IRequestAvatarUploadUrlUseCase.js';

interface Deps {
  storageProvider: IStorageProvider;
}

function sanitizeFilename(name: string): string {
  return name
    .replace(/\s+/g, '-')
    .replace(/[^a-zA-Z0-9._-]/g, '')
    .slice(0, 200);
}

export class RequestAvatarUploadUrlUseCase implements IRequestAvatarUploadUrlUseCase {
  constructor(private readonly deps: Deps) {}

  async execute(input: RequestAvatarUploadUrlInput): Promise<RequestAvatarUploadUrlOutput> {
    assertAllowedAvatarMimeType(input.mimeType);

    const sanitized = sanitizeFilename(input.filename);
    const storageKey = `users/${input.userId}/avatar/${nanoid()}-${sanitized}`;
    // Avatars are intentionally public so the web app and any future
    // embed/print surfaces can render them via the CDN URL without an
    // auth round-trip per image. Uploaded as public blobs in storage.
    const uploadUrl = await this.deps.storageProvider.getPresignedUploadUrl(
      storageKey,
      input.mimeType,
      'public',
    );

    return { uploadUrl, storageKey };
  }
}
