import { Storage } from '@google-cloud/storage';
import type { IStorageProvider } from '@/use-cases/ports/IStorageProvider.js';
import { ENV } from '@/constants.js';

export class GCSStorageProvider implements IStorageProvider {
  private readonly bucket: ReturnType<Storage['bucket']>;

  constructor() {
    const clientEmail = process.env[ENV.GCS_CLIENT_EMAIL];
    const privateKey = process.env[ENV.GCS_PRIVATE_KEY];

    // With no explicit credentials, the client falls back to Application
    // Default Credentials — e.g. the service account Cloud Run attaches to
    // the running container. Explicit credentials are only needed when
    // running somewhere other than GCP (or for local dev against a real
    // bucket).
    const storage =
      clientEmail && privateKey
        ? new Storage({
            projectId: process.env[ENV.GCS_PROJECT_ID],
            credentials: {
              client_email: clientEmail,
              private_key: privateKey.replace(/\\n/g, '\n'),
            },
          })
        : new Storage({ projectId: process.env[ENV.GCS_PROJECT_ID] });

    this.bucket = storage.bucket(process.env[ENV.GCS_BUCKET]!);
  }

  async getPresignedUploadUrl(key: string, mimeType: string, ttlSeconds = 300): Promise<string> {
    const [url] = await this.bucket.file(key).getSignedUrl({
      version: 'v4',
      action: 'write',
      expires: Date.now() + ttlSeconds * 1000,
      contentType: mimeType,
    });
    return url;
  }

  async getSignedUrl(key: string, ttlSeconds = 3600): Promise<string> {
    const [url] = await this.bucket.file(key).getSignedUrl({
      version: 'v4',
      action: 'read',
      expires: Date.now() + ttlSeconds * 1000,
    });
    return url;
  }

  async delete(key: string): Promise<void> {
    await this.bucket.file(key).delete({ ignoreNotFound: true });
  }
}
