import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ENV } from '@/constants.js';
import { PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { R2StorageProvider } from '@/infrastructure/storage/R2StorageProvider.js';

const { sendMock, getSignedUrlMock } = vi.hoisted(() => ({
  sendMock: vi.fn(),
  getSignedUrlMock: vi.fn(),
}));

vi.mock('@aws-sdk/client-s3', () => {
  class S3Client {
    send = sendMock;
  }
  class PutObjectCommand {
    constructor(public input: unknown) {}
  }
  class GetObjectCommand {
    constructor(public input: unknown) {}
  }
  class DeleteObjectCommand {
    constructor(public input: unknown) {}
  }
  return { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand };
});

vi.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: getSignedUrlMock,
}));

describe('R2StorageProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env[ENV.R2_BUCKET] = 'test-bucket';
    process.env[ENV.R2_ENDPOINT] = 'https://r2.example.com';
    process.env[ENV.R2_ACCESS_KEY_ID] = 'access-key';
    process.env[ENV.R2_SECRET_ACCESS_KEY] = 'secret-key';
  });

  describe('getPresignedUploadUrl', () => {
    it('signs a PutObjectCommand with the bucket, key, and content type', async () => {
      getSignedUrlMock.mockResolvedValue('https://signed-upload-url');
      const provider = new R2StorageProvider();

      const url = await provider.getPresignedUploadUrl('users/u1/resume.pdf', 'application/pdf');

      expect(url).toBe('https://signed-upload-url');
      const [, command, options] = getSignedUrlMock.mock.calls[0];
      expect(command).toBeInstanceOf(PutObjectCommand);
      expect(command.input).toEqual({
        Bucket: 'test-bucket',
        Key: 'users/u1/resume.pdf',
        ContentType: 'application/pdf',
      });
      expect(options).toEqual({ expiresIn: 300 });
    });

    it('uses the provided ttlSeconds instead of the 300s default', async () => {
      getSignedUrlMock.mockResolvedValue('https://signed-upload-url');
      const provider = new R2StorageProvider();

      await provider.getPresignedUploadUrl('key.pdf', 'application/pdf', 900);

      const [, , options] = getSignedUrlMock.mock.calls[0];
      expect(options).toEqual({ expiresIn: 900 });
    });
  });

  describe('getSignedUrl', () => {
    it('signs a GetObjectCommand with the bucket and key', async () => {
      getSignedUrlMock.mockResolvedValue('https://signed-download-url');
      const provider = new R2StorageProvider();

      const url = await provider.getSignedUrl('users/u1/resume.pdf');

      expect(url).toBe('https://signed-download-url');
      const [, command, options] = getSignedUrlMock.mock.calls[0];
      expect(command).toBeInstanceOf(GetObjectCommand);
      expect(command.input).toEqual({ Bucket: 'test-bucket', Key: 'users/u1/resume.pdf' });
      expect(options).toEqual({ expiresIn: 3600 });
    });

    it('uses the provided ttlSeconds instead of the 3600s default', async () => {
      getSignedUrlMock.mockResolvedValue('https://signed-download-url');
      const provider = new R2StorageProvider();

      await provider.getSignedUrl('key.pdf', 60);

      const [, , options] = getSignedUrlMock.mock.calls[0];
      expect(options).toEqual({ expiresIn: 60 });
    });
  });

  describe('delete', () => {
    it('sends a DeleteObjectCommand for the given key', async () => {
      sendMock.mockResolvedValue(undefined);
      const provider = new R2StorageProvider();

      await provider.delete('users/u1/resume.pdf');

      expect(sendMock).toHaveBeenCalledWith(expect.any(DeleteObjectCommand));
      const command = sendMock.mock.calls[0][0];
      expect(command.input).toEqual({ Bucket: 'test-bucket', Key: 'users/u1/resume.pdf' });
    });
  });
});
