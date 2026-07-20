export interface Document {
  id: string;
  applicationId: string;
  name: string;
  mimeType: string;
  sizeBytes: number;
  storageKey: string;
  documentType: string;
  version: string | null;
  createdAt: Date;
}
