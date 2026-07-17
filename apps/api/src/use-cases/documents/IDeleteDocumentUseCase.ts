export interface DeleteDocumentInput {
  userId: string;
  documentId: string;
}

export interface IDeleteDocumentUseCase {
  execute(input: DeleteDocumentInput): Promise<void>;
}
