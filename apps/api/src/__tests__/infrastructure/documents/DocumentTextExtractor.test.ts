import { describe, it, expect } from 'vitest';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { DocumentTextExtractor } from '#src/infrastructure/documents/DocumentTextExtractor.js';
import { MIME_TYPE } from '#src/use-cases/constants.js';

const FIXTURES_DIR = join(import.meta.dirname, '..', '..', 'fixtures');

describe('DocumentTextExtractor', () => {
  const extractor = new DocumentTextExtractor();

  it('extracts text from a PDF', async () => {
    const buffer = await readFile(join(FIXTURES_DIR, 'sample-resume.pdf'));
    const text = await extractor.extract(buffer, MIME_TYPE.PDF);
    expect(text).toContain('Jane Doe');
    expect(text).toContain('Senior Software Engineer');
  });

  it('extracts text from a DOCX', async () => {
    const buffer = await readFile(join(FIXTURES_DIR, 'sample-resume.docx'));
    const text = await extractor.extract(buffer, MIME_TYPE.DOCX);
    expect(text).toContain('Jane Doe');
    expect(text).toContain('Senior Software Engineer');
  });

  it('reads text/plain directly as utf8', async () => {
    const buffer = Buffer.from('Plain text resume content', 'utf8');
    const text = await extractor.extract(buffer, MIME_TYPE.TEXT_PLAIN);
    expect(text).toBe('Plain text resume content');
  });

  it('throws VALIDATION for legacy .doc files', async () => {
    const buffer = Buffer.from('irrelevant', 'utf8');
    const err = await extractor.extract(buffer, MIME_TYPE.DOC).catch((e) => e);
    expect((err as { code: string }).code).toBe('VALIDATION');
    expect((err as Error).message).toMatch(/paste your resume text instead/);
  });

  it('throws VALIDATION for unsupported (e.g. image) mime types', async () => {
    const buffer = Buffer.from('irrelevant', 'utf8');
    const err = await extractor.extract(buffer, MIME_TYPE.PNG).catch((e) => e);
    expect((err as { code: string }).code).toBe('VALIDATION');
  });
});
