import { promises as fs } from 'fs';
import { join, dirname } from 'path';
import type { IStorageProvider } from '#src/use-cases/ports/IStorageProvider.js';
import { ENV } from '#src/constants.js';

export class LocalStorageProvider implements IStorageProvider {
  private readonly uploadDir: string;
  private readonly baseUrl: string;

  constructor() {
    this.uploadDir = join(process.cwd(), 'uploads');
    this.baseUrl = `http://localhost:${process.env[ENV.PORT] ?? 3001}/uploads`;
  }

  async getPresignedUploadUrl(key: string): Promise<string> {
    const filePath = join(this.uploadDir, key);
    await fs.mkdir(dirname(filePath), { recursive: true });
    // In local dev, return a URL that the API itself handles for the upload
    return `${this.baseUrl}/_upload/${encodeURIComponent(key)}`;
  }

  async getSignedUrl(key: string): Promise<string> {
    return `${this.baseUrl}/${key}`;
  }

  async putObject(key: string, data: Buffer, _mimeType: string): Promise<void> {
    const filePath = join(this.uploadDir, key);
    await fs.mkdir(dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, data);
  }

  async delete(key: string): Promise<void> {
    const filePath = join(this.uploadDir, key);
    try {
      await fs.unlink(filePath);
    } catch {
      // Ignore if file doesn't exist
    }
  }
}
