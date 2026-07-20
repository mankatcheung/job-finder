export interface DeleteContactInput {
  userId: string;
  contactId: string;
}

export interface IDeleteContactUseCase {
  execute(input: DeleteContactInput): Promise<void>;
}
