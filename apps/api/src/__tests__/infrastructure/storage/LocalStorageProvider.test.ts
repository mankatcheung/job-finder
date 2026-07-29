import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LocalStorageProvider } from '#src/infrastructure/storage/LocalStorageProvider.js';

vi.mock('fs', () => ({
  promises: {
    mkdir: vi.fn().mockResolvedValue(undefined),
    unlink: vi.fn().mockResolvedValue(undefined),
  },
  statSync: vi.fn(),
  createReadStream: vi.fn().mockReturnValue({} as NodeJS.ReadableStream),
}));

import { promises as fs, statSync, createReadStream } from 'fs';

beforeEach(() => {
  vi.clearAllMocks();
  delete process.env.PORT;
});

describe('LocalStorageProvider', () => {
  describe('getPresignedUploadUrl', () => {
    it('creates the parent directory for the key', async () => {
      const provider = new LocalStorageProvider();
      await provider.getPresignedUploadUrl(
        'users/u1/apps/app-1/file.pdf',
        'application/pdf',
        'private',
      );

      expect(fs.mkdir).toHaveBeenCalledWith(expect.stringContaining('users/u1/apps/app-1'), {
        recursive: true,
      });
    });

    it('returns a URL containing the encoded key', async () => {
      const provider = new LocalStorageProvider();
      const url = await provider.getPresignedUploadUrl(
        'some key/file.pdf',
        'application/pdf',
        'private',
      );

      expect(url).toContain('_upload');
      expect(url).toContain(encodeURIComponent('some key/file.pdf'));
    });

    it('uses PORT env var when set', async () => {
      process.env.PORT = '4000';
      const provider = new LocalStorageProvider();
      const url = await provider.getPresignedUploadUrl('file.pdf', 'application/pdf', 'private');

      expect(url).toContain(':4000');
    });

    it('falls back to port 3001 when PORT is not set', async () => {
      const provider = new LocalStorageProvider();
      const url = await provider.getPresignedUploadUrl('file.pdf', 'application/pdf', 'private');

      expect(url).toContain(':3001');
    });

    it('accepts the access parameter without changing the URL', async () => {
      const provider = new LocalStorageProvider();
      const priv = await provider.getPresignedUploadUrl('file.pdf', 'image/png', 'private');
      const pub = await provider.getPresignedUploadUrl('file.pdf', 'image/png', 'public');
      expect(priv).toBe(pub);
    });
  });

  describe('getPublicUrl', () => {
    it('returns a stable URL containing the key', async () => {
      const provider = new LocalStorageProvider();
      const url = await provider.getPublicUrl('users/u1/avatar/me.png');

      expect(url).toBe('http://localhost:3001/files/users/u1/avatar/me.png');
    });
  });

  describe('getFileStream', () => {
    it('returns a fs read stream and inferred content-type', async () => {
      vi.mocked(statSync).mockReturnValue({ size: 1234 } as ReturnType<typeof statSync>);
      const provider = new LocalStorageProvider();
      const file = await provider.getFileStream('users/u1/resume.pdf');

      expect(file.sizeBytes).toBe(1234);
      expect(file.contentType).toBe('application/pdf');
      expect(createReadStream).toHaveBeenCalledWith(expect.stringContaining('users/u1/resume.pdf'));
    });

    it('returns undefined content-type for unknown extensions', async () => {
      vi.mocked(statSync).mockReturnValue({ size: 12 } as ReturnType<typeof statSync>);
      const provider = new LocalStorageProvider();
      const file = await provider.getFileStream('users/u1/mystery.bin');

      expect(file.sizeBytes).toBe(12);
      expect(file.contentType).toBeUndefined();
    });
  });

  describe('delete', () => {
    it('calls unlink with the correct file path', async () => {
      const provider = new LocalStorageProvider();
      await provider.delete('users/u1/resume.pdf');

      expect(fs.unlink).toHaveBeenCalledWith(expect.stringContaining('users/u1/resume.pdf'));
    });

    it('swallows errors when the file does not exist', async () => {
      vi.mocked(fs.unlink).mockRejectedValueOnce(new Error('ENOENT'));
      const provider = new LocalStorageProvider();

      await expect(provider.delete('missing.pdf')).resolves.toBeUndefined();
    });
  });
});
