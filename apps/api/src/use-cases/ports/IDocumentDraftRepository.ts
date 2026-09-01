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
  countByApplicationId(applicationId: string): Promise<number>;
  findById(id: string): Promise<DocumentDraft | null>;
  create(data: CreateDocumentDraftData): Promise<DocumentDraft>;
  updateContent(id: string, data: UpdateDocumentDraftContentData): Promise<DocumentDraft>;
  rename(id: string, title: string): Promise<DocumentDraft>;
  delete(id: string): Promise<void>;
  /**
   * The user's most recent cover letter drafts on applications *other than*
   * `excludeApplicationId` (JEF-249) — backs the opt-in cross-application
   * context fed into cover letter generation. Excludes trashed applications,
   * same as every other read path.
   */
  findRecentCoverLettersByUserExcludingApplication(
    userId: string,
    excludeApplicationId: string,
    limit: number,
  ): Promise<DocumentDraft[]>;
}
