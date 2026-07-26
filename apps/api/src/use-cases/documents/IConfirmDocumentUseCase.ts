import type { Document } from '#src/domain/document/Document.js';

export interface ConfirmDocumentInput {
  userId: string;
  applicationId: string;
  storageKey: string;
  name: string;
  mimeType: string;
  sizeBytes: number;
  documentType?: string;
  version?: string | null;
}

export type ConfirmDocumentOutput = Document;

export interface IConfirmDocumentUseCase {
  execute(input: ConfirmDocumentInput): Promise<ConfirmDocumentOutput>;
}
