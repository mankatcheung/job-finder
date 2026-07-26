import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LocalStorageProvider } from '#src/infrastructure/storage/LocalStorageProvider.js';

vi.mock('fs', () => ({
  promises: {
    mkdir: vi.fn().mockResolvedValue(undefined),
    unlink: vi.fn().mockResolvedValue(undefined),
  },
}));

import { promises as fs } from 'fs';

beforeEach(() => {
  vi.clearAllMocks();
  delete process.env.PORT;
});

describe('LocalStorageProvider', () => {
  describe('getPresignedUploadUrl', () => {
    it('creates the parent directory for the key', async () => {
      const provider = new LocalStorageProvider();
      await provider.getPresignedUploadUrl('users/u1/apps/app-1/file.pdf');

      expect(fs.mkdir).toHaveBeenCalledWith(expect.stringContaining('users/u1/apps/app-1'), {
        recursive: true,
      });
    });

    it('returns a URL containing the encoded key', async () => {
      const provider = new LocalStorageProvider();
      const url = await provider.getPresignedUploadUrl('some key/file.pdf');

      expect(url).toContain('_upload');
      expect(url).toContain(encodeURIComponent('some key/file.pdf'));
    });

    it('uses PORT env var when set', async () => {
      process.env.PORT = '4000';
      const provider = new LocalStorageProvider();
      const url = await provider.getPresignedUploadUrl('file.pdf');

      expect(url).toContain(':4000');
    });

    it('falls back to port 3001 when PORT is not set', async () => {
      const provider = new LocalStorageProvider();
      const url = await provider.getPresignedUploadUrl('file.pdf');

      expect(url).toContain(':3001');
    });
  });

  describe('getSignedUrl', () => {
    it('returns a URL containing the key', async () => {
      const provider = new LocalStorageProvider();
      const url = await provider.getSignedUrl('users/u1/resume.pdf');

      expect(url).toContain('users/u1/resume.pdf');
      expect(url).toContain('/uploads/');
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
