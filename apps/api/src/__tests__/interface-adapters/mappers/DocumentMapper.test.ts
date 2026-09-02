import { describe, it, expect } from 'vitest';
import { DocumentMapper } from '#src/interface-adapters/mappers/DocumentMapper.js';
import { makeDocument } from '#src/__tests__/helpers/mocks/documents.js';

describe('DocumentMapper', () => {
  const mapper = new DocumentMapper();

  it('converts createdAt to an ISO string', () => {
    const doc = makeDocument({ createdAt: new Date('2024-05-01T12:00:00.000Z') });

    const dto = mapper.toDTO(doc, 'https://cdn.example.com/resume.pdf');

    expect(dto.createdAt).toBe('2024-05-01T12:00:00.000Z');
  });

  it('uses the provided signedUrl as the url field', () => {
    const doc = makeDocument();
    const signedUrl = 'https://r2.example.com/signed?token=abc123';

    const dto = mapper.toDTO(doc, signedUrl);

    expect(dto.url).toBe(signedUrl);
  });

  it('passes all scalar fields through unchanged', () => {
    const doc = makeDocument({
      id: 'doc-xyz',
      applicationId: 'app-abc',
      name: 'cover-letter.pdf',
      mimeType: 'application/pdf',
      sizeBytes: 98765,
    });

    const dto = mapper.toDTO(doc, 'https://cdn.example.com/cover-letter.pdf');

    expect(dto.id).toBe('doc-xyz');
    expect(dto.applicationId).toBe('app-abc');
    expect(dto.name).toBe('cover-letter.pdf');
    expect(dto.mimeType).toBe('application/pdf');
    expect(dto.sizeBytes).toBe(98765);
  });
});
