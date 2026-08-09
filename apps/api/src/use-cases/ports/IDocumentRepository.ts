import type { Document } from '#src/domain/document/Document.js';

export interface CreateDocumentData {
  id: string;
  applicationId: string;
  name: string;
  mimeType: string;
  sizeBytes: number;
  storageKey: string;
  documentType?: string;
  version?: string | null;
  sourceDraftId?: string | null;
}

export interface IDocumentRepository {
  findAllByApplicationId(applicationId: string): Promise<Document[]>;
  /** Every document across every application owned by the user — for cross-application aggregation (e.g. resume-version outcome correlation). */
  findAllByUserId(userId: string): Promise<Document[]>;
  findById(id: string): Promise<Document | null>;
  create(data: CreateDocumentData): Promise<Document>;
  delete(id: string): Promise<void>;
}
