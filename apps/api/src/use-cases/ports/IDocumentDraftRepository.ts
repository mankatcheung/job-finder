import type { DocumentDraft } from '#src/domain/documentDraft/DocumentDraft.js';

export interface CreateDocumentDraftData {
  id: string;
  applicationId: string;
  type: 'cover_letter' | 'resume';
  title: string;
  contentJson?: string;
  plainText?: string;
  sourceDocumentId?: string | null;
}

export interface UpdateDocumentDraftContentData {
  contentJson: string;
  plainText: string;
}

export interface IDocumentDraftRepository {
  findAllByApplicationId(applicationId: string): Promise<DocumentDraft[]>;
  findById(id: string): Promise<DocumentDraft | null>;
  create(data: CreateDocumentDraftData): Promise<DocumentDraft>;
  updateContent(id: string, data: UpdateDocumentDraftContentData): Promise<DocumentDraft>;
  delete(id: string): Promise<void>;
}
