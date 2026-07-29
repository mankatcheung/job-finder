import { promises as fs, createReadStream, statSync } from 'fs';
import { join, dirname, basename } from 'path';
import type { Readable } from 'stream';
import type {
  IStorageProvider,
  StorageAccess,
  StorageFile,
} from '#src/use-cases/ports/IStorageProvider.js';
import { ENV } from '#src/constants.js';

/**
 * Local dev provider — files land under `./uploads/` and are served by the
 * API's authenticated streaming route, so they're never publicly fetchable.
 * `access` is accepted for API compatibility with the Vercel provider but
 * ignored: dev-only files don't need a public CDN URL.
 */
export class LocalStorageProvider implements IStorageProvider {
  private readonly uploadDir: string;
  private readonly baseUrl: string;

  constructor() {
    this.uploadDir = join(process.cwd(), 'uploads');
    this.baseUrl = `http://localhost:${process.env[ENV.PORT] ?? 3001}`;
  }

  private resolvePath(key: string): string {
    return join(this.uploadDir, key);
  }

  async getPresignedUploadUrl(
    key: string,
    _mimeType: string,
    _access: StorageAccess,
  ): Promise<string> {
    // In local dev, returns a URL the API itself handles for the upload.
    // The key is encoded into the path so the server route can recreate
    // the file location without trusting any request body.
    const filePath = this.resolvePath(key);
    await fs.mkdir(dirname(filePath), { recursive: true });
    return `${this.baseUrl}/files/_upload/${encodeURIComponent(key)}`;
  }

  async getPublicUrl(key: string): Promise<string> {
    // Mirrors the production Vercel provider's behavior for consistency:
    // public assets get a stable URL exposed through the API's auth-gated
    // `/files/:key` route. Avatars are public but the API still serves them
    // here since the dev environment doesn't have a public CDN.
    return `${this.baseUrl}/files/${key}`;
  }

  async getFileStream(key: string): Promise<StorageFile> {
    const filePath = this.resolvePath(key);
    const stats = statSync(filePath);
    return {
      body: createReadStream(filePath) as Readable,
      contentType: guessContentType(key),
      sizeBytes: stats.size,
    };
  }

  async delete(key: string): Promise<void> {
    const filePath = this.resolvePath(key);
    try {
      await fs.unlink(filePath);
    } catch {
      // Ignore if file doesn't exist
    }
  }
}

/**
 * Minimal extension-based MIME guess for the dev/local provider. The Vercel
 * provider returns the real content-type from Vercel Blob. We don't pull in
 * a full MIME database here — avatars and resumes are the only kinds the
 * app uploads in dev, and these cover those.
 */
function guessContentType(key: string): string | undefined {
  const ext = basename(key)
    .toLowerCase()
    .match(/\.[^.]+$/)?.[0];
  switch (ext) {
    case '.pdf':
      return 'application/pdf';
    case '.doc':
      return 'application/msword';
    case '.docx':
      return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    case '.txt':
      return 'text/plain';
    case '.png':
      return 'image/png';
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg';
    case '.webp':
      return 'image/webp';
    default:
      return undefined;
  }
}
