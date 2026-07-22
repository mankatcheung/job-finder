import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ENV } from '@/constants.js';
import { GCSStorageProvider } from '@/infrastructure/storage/GCSStorageProvider.js';

const { getSignedUrlMock, deleteMock, fileMock, bucketMock, storageCtorMock } = vi.hoisted(() => {
  const getSignedUrlMock = vi.fn();
  const deleteMock = vi.fn();
  const fileMock = vi.fn(() => ({ getSignedUrl: getSignedUrlMock, delete: deleteMock }));
  const bucketMock = vi.fn(() => ({ file: fileMock }));
  const storageCtorMock = vi.fn();
  return { getSignedUrlMock, deleteMock, fileMock, bucketMock, storageCtorMock };
});

vi.mock('@google-cloud/storage', () => {
  class Storage {
    constructor(...args: unknown[]) {
      storageCtorMock(...args);
    }
    bucket = bucketMock;
  }
  return { Storage };
});

describe('GCSStorageProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env[ENV.GCS_BUCKET] = 'test-bucket';
    delete process.env[ENV.GCS_PROJECT_ID];
    delete process.env[ENV.GCS_CLIENT_EMAIL];
    delete process.env[ENV.GCS_PRIVATE_KEY];
  });

  describe('constructor', () => {
    it('falls back to Application Default Credentials when no explicit key is configured', () => {
      new GCSStorageProvider();

      expect(storageCtorMock).toHaveBeenCalledWith({ projectId: undefined });
      expect(bucketMock).toHaveBeenCalledWith('test-bucket');
    });

    it('passes explicit service-account credentials when configured', () => {
      process.env[ENV.GCS_PROJECT_ID] = 'test-project';
      process.env[ENV.GCS_CLIENT_EMAIL] = 'sa@test-project.iam.gserviceaccount.com';
      process.env[ENV.GCS_PRIVATE_KEY] = '-----BEGIN KEY-----\\nabc\\n-----END KEY-----';

      new GCSStorageProvider();

      expect(storageCtorMock).toHaveBeenCalledWith({
        projectId: 'test-project',
        credentials: {
          client_email: 'sa@test-project.iam.gserviceaccount.com',
          private_key: '-----BEGIN KEY-----\nabc\n-----END KEY-----',
        },
      });
    });
  });

  describe('getPresignedUploadUrl', () => {
    it('signs a v4 write URL with the key and content type', async () => {
      getSignedUrlMock.mockResolvedValue(['https://signed-upload-url']);
      const provider = new GCSStorageProvider();

      const url = await provider.getPresignedUploadUrl('users/u1/resume.pdf', 'application/pdf');

      expect(url).toBe('https://signed-upload-url');
      expect(fileMock).toHaveBeenCalledWith('users/u1/resume.pdf');
      const [options] = getSignedUrlMock.mock.calls[0];
      expect(options).toMatchObject({
        version: 'v4',
        action: 'write',
        contentType: 'application/pdf',
      });
    });

    it('uses the provided ttlSeconds instead of the 300s default', async () => {
      getSignedUrlMock.mockResolvedValue(['https://signed-upload-url']);
      const provider = new GCSStorageProvider();
      const before = Date.now();

      await provider.getPresignedUploadUrl('key.pdf', 'application/pdf', 900);

      const [options] = getSignedUrlMock.mock.calls[0];
      expect(options.expires).toBeGreaterThanOrEqual(before + 900 * 1000);
      expect(options.expires).toBeLessThan(before + 901 * 1000);
    });
  });

  describe('getSignedUrl', () => {
    it('signs a v4 read URL for the given key', async () => {
      getSignedUrlMock.mockResolvedValue(['https://signed-download-url']);
      const provider = new GCSStorageProvider();

      const url = await provider.getSignedUrl('users/u1/resume.pdf');

      expect(url).toBe('https://signed-download-url');
      expect(fileMock).toHaveBeenCalledWith('users/u1/resume.pdf');
      const [options] = getSignedUrlMock.mock.calls[0];
      expect(options).toMatchObject({ version: 'v4', action: 'read' });
    });

    it('uses the provided ttlSeconds instead of the 3600s default', async () => {
      getSignedUrlMock.mockResolvedValue(['https://signed-download-url']);
      const provider = new GCSStorageProvider();
      const before = Date.now();

      await provider.getSignedUrl('key.pdf', 60);

      const [options] = getSignedUrlMock.mock.calls[0];
      expect(options.expires).toBeGreaterThanOrEqual(before + 60 * 1000);
      expect(options.expires).toBeLessThan(before + 61 * 1000);
    });
  });

  describe('delete', () => {
    it('deletes the object for the given key, ignoring not-found', async () => {
      deleteMock.mockResolvedValue(undefined);
      const provider = new GCSStorageProvider();

      await provider.delete('users/u1/resume.pdf');

      expect(fileMock).toHaveBeenCalledWith('users/u1/resume.pdf');
      expect(deleteMock).toHaveBeenCalledWith({ ignoreNotFound: true });
    });
  });
});
