import { ValidationError } from '#src/use-cases/errors/DomainError.js';
import { ALLOWED_AVATAR_MIME_TYPES, MAX_AVATAR_SIZE_BYTES } from '#src/constants.js';

export function assertAllowedAvatarMimeType(mimeType: string): void {
  if (!(ALLOWED_AVATAR_MIME_TYPES as readonly string[]).includes(mimeType)) {
    throw new ValidationError(`Unsupported image type: ${mimeType}`);
  }
}

export function assertValidAvatarSizeBytes(sizeBytes: number): void {
  if (!Number.isFinite(sizeBytes) || sizeBytes <= 0) {
    throw new ValidationError('Image size must be greater than 0 bytes');
  }
  if (sizeBytes > MAX_AVATAR_SIZE_BYTES) {
    throw new ValidationError(
      `Image exceeds the maximum allowed size of ${MAX_AVATAR_SIZE_BYTES} bytes`,
    );
  }
}
