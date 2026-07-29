import { head, del, get } from '@vercel/blob';
import { generateClientTokenFromReadWriteToken } from '@vercel/blob/client';
import type {
  IStorageProvider,
  StorageAccess,
  StorageFile,
} from '#src/use-cases/ports/IStorageProvider.js';
import { ENV } from '#src/constants.js';
import { Readable } from 'stream';

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
 *
 * Access control mirrors `@vercel/blob/client`'s own `access` option: blobs
 * minted as `'public'` get a fetchable CDN URL (`getPublicUrl`); blobs
 * minted as `'private'` can only be read by server-side code that holds
 * the read-write token, so the API serves them through an authenticated
 * streaming route via `getFileStream` (using Vercel's `get()`).
 */
export class VercelBlobStorageProvider implements IStorageProvider {
  private readonly token: string;

  constructor() {
    this.token = process.env[ENV.BLOB_READ_WRITE_TOKEN] ?? '';
  }

  private assertConfigured(): void {
    if (!this.token) {
      throw new Error(`${ENV.BLOB_READ_WRITE_TOKEN} is not configured`);
    }
  }

  async getPresignedUploadUrl(
    key: string,
    mimeType: string,
    access: StorageAccess,
    ttlSeconds = 300,
  ): Promise<string> {
    this.assertConfigured();
    // The SDK's `GenerateClientTokenOptions` type omits `access` from its
    // narrowed public surface, but the runtime (`chunk-CIIQSN42.js`) reads
    // `options.access` to bind the storage class of the resulting blob.
    // `BlobCommandOptions.access?` is available internally; cast so we don't
    // require the SDK to widen its public types just for us.
    return generateClientTokenFromReadWriteToken({
      token: this.token,
      pathname: key,
      allowedContentTypes: [mimeType],
      addRandomSuffix: false,
      validUntil: Date.now() + ttlSeconds * 1000,
      access,
    } as Parameters<typeof generateClientTokenFromReadWriteToken>[0]);
  }

  async getPublicUrl(key: string): Promise<string> {
    this.assertConfigured();
    const blob = await head(key, { token: this.token });
    return blob.url;
  }

  async getFileStream(key: string): Promise<StorageFile> {
    this.assertConfigured();
    // `get()` returns `null` if the blob can't be found, else a discriminated
    // union on `statusCode` (200 vs 304). We only act on a 200 — 304
    // indicates the client already has the latest copy, and we never send
    // a conditional `If-None-Match` from our route.
    const result = await get(key, { access: 'private', token: this.token });
    if (!result || result.statusCode !== 200) {
      throw new Error(`Blob ${key} not found via Vercel Blob`);
    }
    return {
      // `@vercel/blob`'s `get()` returns a WHATWG ReadableStream from the
      // SDK's own namespace; Node's `stream/web` ReadableStream is the
      // same runtime object in Node 18+, but the type-checker treats them
      // as distinct symbol exports. If a future SDK release changes the
      // return type (e.g. to a Node Readable), the build will surface it
      // — revisit the cast then instead of swallowing.
      // @ts-expect-error — cross-namespace ReadableStream type drift (WHATWG vs stream/web); same runtime object in Node 18+
      body: Readable.fromWeb(result.stream),
      contentType: result.blob.contentType ?? undefined,
      sizeBytes: result.blob.size ?? undefined,
    };
  }

  async delete(key: string): Promise<void> {
    if (!this.token) return;
    try {
      await del(key, { token: this.token });
    } catch {
      // Best-effort cleanup — matches LocalStorageProvider.
    }
  }
}
