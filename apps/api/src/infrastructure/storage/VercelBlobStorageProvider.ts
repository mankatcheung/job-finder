import { head, del, put } from '@vercel/blob';
import { generateClientTokenFromReadWriteToken } from '@vercel/blob/client';
import type { IStorageProvider } from '#src/use-cases/ports/IStorageProvider.js';
import { ENV } from '#src/constants.js';

/**
 * Vercel Blob has no raw presigned-PUT URL like S3/GCS — the client must
 * upload using `put()` from `@vercel/blob/client` with a short-lived client
 * token. `getPresignedUploadUrl` returns that token (as an opaque string, in
 * place of a URL) so the existing IStorageProvider contract and
 * RequestUploadUrlUseCase authorization logic don't need to change; the web
 * app passes it straight through to `put()`. This means uploads go directly
 * from the browser to Blob storage, never through our API — important since
 * serverless functions have request body size limits well under the 10MB
 * document cap this app allows.
 */
export class VercelBlobStorageProvider implements IStorageProvider {
  private readonly token: string;

  constructor() {
    this.token = process.env[ENV.BLOB_PUBLIC_READ_WRITE_TOKEN] ?? '';
  }

  private assertConfigured(): void {
    if (!this.token) {
      throw new Error(`${ENV.BLOB_PUBLIC_READ_WRITE_TOKEN} is not configured`);
    }
  }

  async getPresignedUploadUrl(key: string, mimeType: string, ttlSeconds = 300): Promise<string> {
    this.assertConfigured();
    return generateClientTokenFromReadWriteToken({
      token: this.token,
      pathname: key,
      allowedContentTypes: [mimeType],
      addRandomSuffix: false,
      validUntil: Date.now() + ttlSeconds * 1000,
    });
  }

  async getSignedUrl(key: string): Promise<string> {
    this.assertConfigured();
    const blob = await head(key, { token: this.token });
    return blob.url;
  }

  async delete(key: string): Promise<void> {
    if (!this.token) return;
    try {
      await del(key, { token: this.token });
    } catch {
      // Best-effort cleanup — matches LocalStorageProvider.
    }
  }

  async putObject(key: string, data: Buffer, mimeType: string): Promise<void> {
    this.assertConfigured();
    await put(key, data, {
      access: 'public',
      contentType: mimeType,
      token: this.token,
    });
  }
}
