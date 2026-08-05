export interface IStorageProvider {
  getPresignedUploadUrl(key: string, mimeType: string, ttlSeconds?: number): Promise<string>;
  getSignedUrl(key: string, ttlSeconds?: number): Promise<string>;
  putObject(key: string, data: Buffer, mimeType: string): Promise<void>;
  delete(key: string): Promise<void>;
}
