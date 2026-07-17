import type { Document } from '@/domain/document/Document.js';

export interface CreateDocumentData {
  id: string;
  applicationId: string;
  name: string;
  mimeType: string;
  sizeBytes: number;
  storageKey: string;
}

export interface IDocumentRepository {
  findAllByApplicationId(applicationId: string): Promise<Document[]>;
  findById(id: string): Promise<Document | null>;
  create(data: CreateDocumentData): Promise<Document>;
  delete(id: string): Promise<void>;
}
