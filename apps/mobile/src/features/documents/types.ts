export interface Document {
  id: string;
  applicationId: string;
  name: string;
  mimeType: string;
  sizeBytes: number;
  url: string;
  documentType: string;
  version: string | null;
  createdAt: string;
}

export interface RequestUploadUrlResult {
  uploadUrl: string;
  storageKey: string;
}
