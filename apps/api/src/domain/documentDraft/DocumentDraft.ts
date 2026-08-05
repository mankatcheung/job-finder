export interface DocumentDraft {
  id: string;
  applicationId: string;
  type: 'cover_letter' | 'resume';
  title: string;
  contentJson: string;
  plainText: string;
  sourceDocumentId: string | null;
  createdAt: Date;
  updatedAt: Date;
}
