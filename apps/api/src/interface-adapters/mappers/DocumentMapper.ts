import type { Document } from '#src/domain/document/Document.js';

export interface DocumentDTO {
  id: string;
  applicationId: string;
  name: string;
  mimeType: string;
  sizeBytes: number;
  url: string;
  documentType: string;
  version: string | null;
  sourceDraftId: string | null;
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
      documentType: doc.documentType,
      version: doc.version,
      sourceDraftId: doc.sourceDraftId,
      createdAt: doc.createdAt.toISOString(),
    };
  }
}
