import type { Document } from '#src/domain/document/Document.js';

export interface GetDocumentsInput {
  userId: string;
  applicationId: string;
}

export type GetDocumentsOutput = Document[];

export interface IGetDocumentsUseCase {
  execute(input: GetDocumentsInput): Promise<GetDocumentsOutput>;
}
