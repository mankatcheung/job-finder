export interface IStorageProvider {
  getPresignedUploadUrl(key: string, mimeType: string, ttlSeconds?: number): Promise<string>;
  getSignedUrl(key: string, ttlSeconds?: number): Promise<string>;
  delete(key: string): Promise<void>;
}
