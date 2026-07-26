import { ERROR_CODES, ALLOWED_AVATAR_MIME_TYPES, MAX_AVATAR_SIZE_BYTES } from '#src/constants.js';

export function assertAllowedAvatarMimeType(mimeType: string): void {
  if (!(ALLOWED_AVATAR_MIME_TYPES as readonly string[]).includes(mimeType)) {
    throw Object.assign(new Error(`Unsupported image type: ${mimeType}`), {
      code: ERROR_CODES.VALIDATION,
    });
  }
}

export function assertValidAvatarSizeBytes(sizeBytes: number): void {
  if (!Number.isFinite(sizeBytes) || sizeBytes <= 0) {
    throw Object.assign(new Error('Image size must be greater than 0 bytes'), {
      code: ERROR_CODES.VALIDATION,
    });
  }
  if (sizeBytes > MAX_AVATAR_SIZE_BYTES) {
    throw Object.assign(
      new Error(`Image exceeds the maximum allowed size of ${MAX_AVATAR_SIZE_BYTES} bytes`),
      { code: ERROR_CODES.VALIDATION },
    );
  }
}
