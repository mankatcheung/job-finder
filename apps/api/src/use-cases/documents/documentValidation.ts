import { ValidationError } from '#src/use-cases/errors/DomainError.js';
import { ALLOWED_DOCUMENT_MIME_TYPES, MAX_DOCUMENT_SIZE_BYTES } from '#src/constants.js';

export function assertAllowedMimeType(mimeType: string): void {
  if (!(ALLOWED_DOCUMENT_MIME_TYPES as readonly string[]).includes(mimeType)) {
    throw new ValidationError(`Unsupported file type: ${mimeType}`);
  }
}

export function assertValidSizeBytes(sizeBytes: number): void {
  if (!Number.isFinite(sizeBytes) || sizeBytes <= 0) {
    throw new ValidationError('File size must be greater than 0 bytes');
  }
  if (sizeBytes > MAX_DOCUMENT_SIZE_BYTES) {
    throw new ValidationError(
      `File exceeds the maximum allowed size of ${MAX_DOCUMENT_SIZE_BYTES} bytes`,
    );
  }
}
