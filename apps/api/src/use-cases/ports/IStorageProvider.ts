export interface IStorageProvider {
  getPresignedUploadUrl(key: string, mimeType: string, ttlSeconds?: number): Promise<string>;
  getSignedUrl(key: string, ttlSeconds?: number): Promise<string>;
  putObject(key: string, data: Buffer, mimeType: string): Promise<void>;
  delete(key: string): Promise<void>;
  /**
   * Remove several objects in as few round trips as the backend allows.
   * Emptying Trash runs this once per application from inside a serverless
   * request, where a call per blob adds up quickly. Best-effort like
   * `delete`: a key that is already gone is not an error.
   */
  deleteMany(keys: string[]): Promise<void>;
}
