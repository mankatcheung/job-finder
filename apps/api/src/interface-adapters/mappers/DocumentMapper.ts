import type { Document } from '@/domain/document/Document.js';

export interface DocumentDTO {
  id: string;
  applicationId: string;
  name: string;
  mimeType: string;
  sizeBytes: number;
  url: string;
  createdAt: string;
}

export class DocumentMapper {
  toDTO(doc: Document, signedUrl: string): DocumentDTO {
    return {
      id: doc.id,
      applicationId: doc.applicationId,
      name: doc.name,
      mimeType: doc.mimeType,
      sizeBytes: doc.sizeBytes,
      url: signedUrl,
      createdAt: doc.createdAt.toISOString(),
    };
  }
}
