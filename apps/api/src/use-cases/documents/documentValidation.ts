import { ERROR_CODES, ALLOWED_DOCUMENT_MIME_TYPES, MAX_DOCUMENT_SIZE_BYTES } from '@/constants.js';

export function assertAllowedMimeType(mimeType: string): void {
  if (!(ALLOWED_DOCUMENT_MIME_TYPES as readonly string[]).includes(mimeType)) {
    throw Object.assign(new Error(`Unsupported file type: ${mimeType}`), {
      code: ERROR_CODES.VALIDATION,
    });
  }
}

export function assertValidSizeBytes(sizeBytes: number): void {
  if (!Number.isFinite(sizeBytes) || sizeBytes <= 0) {
    throw Object.assign(new Error('File size must be greater than 0 bytes'), {
      code: ERROR_CODES.VALIDATION,
    });
  }
  if (sizeBytes > MAX_DOCUMENT_SIZE_BYTES) {
    throw Object.assign(
      new Error(`File exceeds the maximum allowed size of ${MAX_DOCUMENT_SIZE_BYTES} bytes`),
      { code: ERROR_CODES.VALIDATION },
    );
  }
}
