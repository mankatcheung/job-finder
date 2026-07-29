import type { Readable } from 'stream';

/** Whether a blob is publicly readable or requires authenticated access. */
export type StorageAccess = 'public' | 'private';

/**
 * Server-side artifact for re-sending a stored file to a client. The body is
 * always a Node stream (we never load whole files into memory — documents can
 * hit the 10MB cap, which is well past the safe heap for an in-process read).
 */
export interface StorageFile {
  body: Readable;
  contentType?: string;
  sizeBytes?: number;
}

export interface IStorageProvider {
  /**
   * Generates a short-lived credential (URL or opaque token) the browser uses
   * to upload a file directly to storage. `access` controls whether the
   * resulting blob is publicly fetchable or only reachable through the API
   * (`provider.getFileStream`).
   */
  getPresignedUploadUrl(
    key: string,
    mimeType: string,
    access: StorageAccess,
    ttlSeconds?: number,
  ): Promise<string>;

  /**
   * Returns a public browser URL for an asset uploaded as `'public'` (e.g.
   * avatars). For private uploads, no such URL exists — clients should go
   * through the API's authenticated `/files/:key` streaming endpoint instead.
   */
  getPublicUrl(key: string): Promise<string>;

  /**
   * Streams the file body for private blobs. The API serves this through an
   * authenticated, ownership-checked HTTP route so private blobs never reach
   * the browser directly. Provider implementations decide how to fetch from
   * the underlying storage.
   */
  getFileStream(key: string): Promise<StorageFile>;

  delete(key: string): Promise<void>;
}
